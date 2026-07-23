import { useLayoutEffect, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/common/Button';
import ReportShareFallbackModal from '@/components/report-page/ReportShareFallbackModal';

import type { CurrencyType } from '@/types/currency';

import { useCreateReportShareMutation } from '@/api/share/query';
import { trackEvent } from '@/lib/analytics';
import { copyTextToClipboard } from '@/lib/clipboard';
import {
  copyReportShareLink,
  createAndCopyReportShareLink,
} from '@/lib/share/flow';
import { resolveReportShareUrl } from '@/lib/share/url';

interface ReportShareButtonProps {
  accountBookId: number;
  year: number;
  month: number;
  currencyType: CurrencyType;
}

interface ShareAttempt {
  id: number;
  selectionKey: string;
}

interface FallbackLink {
  url: string;
  attempt: ShareAttempt;
}

const ReportShareButton = ({
  accountBookId,
  year,
  month,
  currencyType,
}: ReportShareButtonProps) => {
  const createShare = useCreateReportShareMutation();
  const selectionKey = `${accountBookId}:${year}:${month}:${currencyType}`;
  const [previousSelectionKey, setPreviousSelectionKey] =
    useState(selectionKey);
  const [fallbackLink, setFallbackLink] = useState<FallbackLink | null>(null);
  const attemptSequenceRef = useRef(0);
  const activeAttemptRef = useRef<ShareAttempt | null>(null);
  const completedAttemptRef = useRef<ShareAttempt | null>(null);
  const fallbackCopyPendingRef = useRef<ShareAttempt | null>(null);
  const currentSelectionKeyRef = useRef(selectionKey);

  if (previousSelectionKey !== selectionKey) {
    setPreviousSelectionKey(selectionKey);
    setFallbackLink(null);
  }

  const visibleFallback =
    fallbackLink?.attempt.selectionKey === selectionKey ? fallbackLink : null;

  useLayoutEffect(() => {
    currentSelectionKeyRef.current = selectionKey;
    activeAttemptRef.current = null;
    completedAttemptRef.current = null;
    fallbackCopyPendingRef.current = null;

    return () => {
      activeAttemptRef.current = null;
      completedAttemptRef.current = null;
      fallbackCopyPendingRef.current = null;
    };
  }, [selectionKey]);

  const isCurrentAttempt = (attempt: ShareAttempt) =>
    activeAttemptRef.current === attempt &&
    currentSelectionKeyRef.current === attempt.selectionKey;

  const completeCopy = (attempt: ShareAttempt): boolean => {
    if (!isCurrentAttempt(attempt) || completedAttemptRef.current === attempt) {
      return false;
    }

    completedAttemptRef.current = attempt;
    setFallbackLink(null);
    toast.success('링크가 복사되었어요');
    return true;
  };

  const handleShare = () => {
    const attempt: ShareAttempt = {
      id: attemptSequenceRef.current + 1,
      selectionKey,
    };
    attemptSequenceRef.current = attempt.id;
    activeAttemptRef.current = attempt;
    completedAttemptRef.current = null;
    fallbackCopyPendingRef.current = null;
    setFallbackLink(null);

    void createAndCopyReportShareLink({
      createShare: () =>
        createShare.mutateAsync({ accountBookId, year, month, currencyType }),
      resolveUrl: (url) => resolveReportShareUrl(url, window.location.origin),
      copyText: copyTextToClipboard,
      isCurrent: () => isCurrentAttempt(attempt),
      onUrlResolutionFailure: () =>
        toast.error('공유 링크를 확인하지 못했어요. 다시 시도해주세요.'),
      onCopySuccess: () => completeCopy(attempt),
      onCopyFailure: (url) => {
        setFallbackLink({ url, attempt });
        toast.error('자동 복사가 제한되어 링크를 직접 복사해주세요.');
      },
      trackCopySuccess: () => trackEvent('share_report_create'),
    });
  };

  const handleFallbackCopy = async () => {
    if (
      !visibleFallback ||
      fallbackCopyPendingRef.current === visibleFallback.attempt
    ) {
      return;
    }

    const { attempt, url } = visibleFallback;
    fallbackCopyPendingRef.current = attempt;

    try {
      await copyReportShareLink({
        url,
        copyText: copyTextToClipboard,
        isCurrent: () => isCurrentAttempt(attempt),
        onCopySuccess: () => completeCopy(attempt),
        onCopyFailure: () =>
          toast.error('입력창의 링크를 직접 선택해 복사해주세요.'),
        trackCopySuccess: () => trackEvent('share_report_create'),
      });
    } finally {
      if (fallbackCopyPendingRef.current === attempt) {
        fallbackCopyPendingRef.current = null;
      }
    }
  };

  return (
    <>
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

      <ReportShareFallbackModal
        isOpen={visibleFallback !== null}
        url={visibleFallback?.url ?? ''}
        onClose={() => setFallbackLink(null)}
        onCopy={handleFallbackCopy}
      />
    </>
  );
};

export default ReportShareButton;
