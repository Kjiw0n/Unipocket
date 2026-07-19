import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/common/Button';

import type { CurrencyType } from '@/types/currency';

import { useCreateReportShareMutation } from '@/api/share/query';
import { trackEvent } from '@/lib/analytics';
import { copyTextToClipboard } from '@/lib/clipboard';
import { resolveReportShareUrl } from '@/lib/share/url';

interface ReportShareButtonProps {
  accountBookId: number;
  year: number;
  month: number;
  currencyType: CurrencyType;
}

const ReportShareButton = ({
  accountBookId,
  year,
  month,
  currencyType,
}: ReportShareButtonProps) => {
  const createShare = useCreateReportShareMutation();

  const handleShare = () => {
    createShare.mutate(
      { accountBookId, year, month, currencyType },
      {
        onSuccess: async ({ url }) => {
          try {
            await copyTextToClipboard(
              resolveReportShareUrl(url, window.location.origin),
            );
            trackEvent('share_report_create');
            toast.success('링크가 복사되었어요');
          } catch {
            toast.error('링크를 복사하지 못했어요. 다시 시도해주세요.');
          }
        },
      },
    );
  };

  return (
    <Button
      type="button"
      variant="outlined"
      size="sm"
      disabled={createShare.isPending}
      onClick={handleShare}
      aria-label="현재 월 리포트 공유 링크 복사"
      className="gap-1.5"
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {createShare.isPending ? '링크 생성 중' : '리포트 공유'}
    </Button>
  );
};

export default ReportShareButton;
