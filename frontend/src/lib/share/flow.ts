import type { CreateReportShareResponse } from '@/api/share/type';

interface CopyReportShareLinkOptions {
  url: string;
  copyText: (text: string) => Promise<void>;
  isCurrent: () => boolean;
  onCopySuccess: () => boolean;
  onCopyFailure: () => void;
  trackCopySuccess: () => void;
}

interface CreateAndCopyReportShareLinkOptions extends Omit<
  CopyReportShareLinkOptions,
  'url' | 'onCopyFailure'
> {
  createShare: () => Promise<CreateReportShareResponse>;
  resolveUrl: (url: string) => string;
  onUrlResolutionFailure: () => void;
  onCopyFailure: (url: string) => void;
}

export const copyReportShareLink = async ({
  url,
  copyText,
  isCurrent,
  onCopySuccess,
  onCopyFailure,
  trackCopySuccess,
}: CopyReportShareLinkOptions): Promise<void> => {
  if (!isCurrent()) return;

  let didCopy = false;
  try {
    await copyText(url);
    didCopy = true;
  } catch {
    // 클립보드 예외만 복사 실패로 분류하고 아래에서 현재 attempt인지 확인한다.
  }

  if (!isCurrent()) return;

  if (!didCopy) {
    onCopyFailure();
    return;
  }

  if (!onCopySuccess()) return;

  try {
    trackCopySuccess();
  } catch {
    // 분석 도구 실패가 이미 성공한 복사 UX를 되돌리지 않도록 best-effort로 처리한다.
  }
};

export const createAndCopyReportShareLink = async ({
  createShare,
  resolveUrl,
  copyText,
  isCurrent,
  onUrlResolutionFailure,
  onCopySuccess,
  onCopyFailure,
  trackCopySuccess,
}: CreateAndCopyReportShareLinkOptions): Promise<void> => {
  let response: CreateReportShareResponse;
  try {
    response = await createShare();
  } catch {
    // mutation 전역 오류 처리가 발급 실패를 사용자에게 안내한다.
    return;
  }

  if (!isCurrent()) return;

  let resolvedUrl: string;
  try {
    resolvedUrl = resolveUrl(response.url);
  } catch {
    if (isCurrent()) onUrlResolutionFailure();
    return;
  }

  if (!isCurrent()) return;

  await copyReportShareLink({
    url: resolvedUrl,
    copyText,
    isCurrent,
    onCopySuccess,
    onCopyFailure: () => onCopyFailure(resolvedUrl),
    trackCopySuccess,
  });
};
