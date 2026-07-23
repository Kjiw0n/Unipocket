import { describe, expect, it, vi } from 'vitest';

import {
  copyReportShareLink,
  createAndCopyReportShareLink,
} from '@/lib/share/flow';

const createCopyCallbacks = () => ({
  onCopySuccess: vi.fn(() => true),
  onCopyFailure: vi.fn(),
  onUrlResolutionFailure: vi.fn(),
  trackCopySuccess: vi.fn(),
});

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

describe('report share flow', () => {
  it('발급 실패는 URL 해석·복사·성공 또는 폴백 처리를 실행하지 않는다', async () => {
    const callbacks = createCopyCallbacks();
    const createShare = vi.fn().mockRejectedValue(new Error('request failed'));
    const resolveUrl = vi.fn();
    const copyText = vi.fn();

    await createAndCopyReportShareLink({
      createShare,
      resolveUrl,
      copyText,
      isCurrent: () => true,
      ...callbacks,
    });

    expect(createShare).toHaveBeenCalledOnce();
    expect(resolveUrl).not.toHaveBeenCalled();
    expect(copyText).not.toHaveBeenCalled();
    expect(callbacks.onCopySuccess).not.toHaveBeenCalled();
    expect(callbacks.onCopyFailure).not.toHaveBeenCalled();
    expect(callbacks.onUrlResolutionFailure).not.toHaveBeenCalled();
    expect(callbacks.trackCopySuccess).not.toHaveBeenCalled();
  });

  it('자동 복사 실패 뒤 같은 URL 재복사는 추가 발급 없이 한 번 성공한다', async () => {
    const callbacks = createCopyCallbacks();
    const createShare = vi
      .fn()
      .mockResolvedValue({ url: '/share?d=test-token' });
    const resolveUrl = vi
      .fn()
      .mockReturnValue('https://example.com/share?d=test-token');
    const copyText = vi
      .fn()
      .mockRejectedValueOnce(new Error('clipboard denied'))
      .mockResolvedValueOnce(undefined);
    let fallbackUrl = '';
    let isFallbackOpen = false;
    const onCopySuccess = vi.fn(() => {
      isFallbackOpen = false;
      return true;
    });

    await createAndCopyReportShareLink({
      createShare,
      resolveUrl,
      copyText,
      isCurrent: () => true,
      onCopySuccess,
      onCopyFailure: (url) => {
        fallbackUrl = url;
        isFallbackOpen = true;
        callbacks.onCopyFailure();
      },
      onUrlResolutionFailure: callbacks.onUrlResolutionFailure,
      trackCopySuccess: callbacks.trackCopySuccess,
    });

    expect(fallbackUrl).toBe('https://example.com/share?d=test-token');
    expect(isFallbackOpen).toBe(true);
    expect(callbacks.onCopyFailure).toHaveBeenCalledOnce();
    expect(onCopySuccess).not.toHaveBeenCalled();

    await copyReportShareLink({
      url: fallbackUrl,
      copyText,
      isCurrent: () => true,
      onCopySuccess,
      onCopyFailure: callbacks.onCopyFailure,
      trackCopySuccess: callbacks.trackCopySuccess,
    });

    expect(createShare).toHaveBeenCalledOnce();
    expect(copyText).toHaveBeenNthCalledWith(
      2,
      'https://example.com/share?d=test-token',
    );
    expect(isFallbackOpen).toBe(false);
    expect(onCopySuccess).toHaveBeenCalledOnce();
    expect(callbacks.trackCopySuccess).toHaveBeenCalledOnce();
  });

  it('선택 변경 중 늦게 끝난 발급은 URL 해석 이후 처리를 모두 생략한다', async () => {
    const callbacks = createCopyCallbacks();
    const response = createDeferred<{ url: string }>();
    const resolveUrl = vi.fn();
    const copyText = vi.fn();
    let isCurrent = true;

    const flow = createAndCopyReportShareLink({
      createShare: () => response.promise,
      resolveUrl,
      copyText,
      isCurrent: () => isCurrent,
      ...callbacks,
    });

    isCurrent = false;
    response.resolve({ url: '/share?d=stale-token' });
    await flow;

    expect(resolveUrl).not.toHaveBeenCalled();
    expect(copyText).not.toHaveBeenCalled();
    expect(callbacks.onCopySuccess).not.toHaveBeenCalled();
    expect(callbacks.onCopyFailure).not.toHaveBeenCalled();
    expect(callbacks.trackCopySuccess).not.toHaveBeenCalled();
  });

  it.each([
    ['성공', true],
    ['실패', false],
  ] as const)(
    '선택 변경 중 늦게 %s한 복사는 성공·실패 후처리를 모두 생략한다',
    async (_result, didCopy) => {
      const callbacks = createCopyCallbacks();
      const copyResult = createDeferred<void>();
      const copyText = vi.fn(() => copyResult.promise);
      let isCurrent = true;

      const flow = copyReportShareLink({
        url: 'https://example.com/share?d=stale-token',
        copyText,
        isCurrent: () => isCurrent,
        onCopySuccess: callbacks.onCopySuccess,
        onCopyFailure: callbacks.onCopyFailure,
        trackCopySuccess: callbacks.trackCopySuccess,
      });

      expect(copyText).toHaveBeenCalledOnce();
      isCurrent = false;
      if (didCopy) {
        copyResult.resolve();
      } else {
        copyResult.reject(new Error('clipboard denied'));
      }
      await flow;

      expect(callbacks.onCopySuccess).not.toHaveBeenCalled();
      expect(callbacks.onCopyFailure).not.toHaveBeenCalled();
      expect(callbacks.trackCopySuccess).not.toHaveBeenCalled();
    },
  );

  it('analytics 예외는 복사 성공을 실패로 바꾸지 않는다', async () => {
    const callbacks = createCopyCallbacks();
    let isFallbackOpen = true;
    const onCopySuccess = vi.fn(() => {
      isFallbackOpen = false;
      return true;
    });
    callbacks.trackCopySuccess.mockImplementation(() => {
      throw new Error('analytics failed');
    });

    await expect(
      copyReportShareLink({
        url: 'https://example.com/share?d=test-token',
        copyText: vi.fn().mockResolvedValue(undefined),
        isCurrent: () => true,
        onCopySuccess,
        onCopyFailure: callbacks.onCopyFailure,
        trackCopySuccess: callbacks.trackCopySuccess,
      }),
    ).resolves.toBeUndefined();

    expect(isFallbackOpen).toBe(false);
    expect(onCopySuccess).toHaveBeenCalledOnce();
    expect(callbacks.onCopyFailure).not.toHaveBeenCalled();
    expect(callbacks.trackCopySuccess).toHaveBeenCalledOnce();
  });

  it('같은 attempt의 복사 성공 후처리와 이벤트는 최대 한 번만 실행한다', async () => {
    let completed = false;
    const closeFallback = vi.fn();
    const onCopySuccess = vi.fn(() => {
      if (completed) return false;
      completed = true;
      closeFallback();
      return true;
    });
    const trackCopySuccess = vi.fn();
    const options = {
      url: 'https://example.com/share?d=test-token',
      copyText: vi.fn().mockResolvedValue(undefined),
      isCurrent: () => true,
      onCopySuccess,
      onCopyFailure: vi.fn(),
      trackCopySuccess,
    };

    await Promise.all([
      copyReportShareLink(options),
      copyReportShareLink(options),
    ]);

    expect(closeFallback).toHaveBeenCalledOnce();
    expect(trackCopySuccess).toHaveBeenCalledOnce();
  });
});
