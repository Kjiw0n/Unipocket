import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyTextToClipboard } from '@/lib/clipboard';

const stubFallbackDocument = (copyResult: boolean) => {
  const textArea = {
    value: '',
    style: {
      position: '',
      opacity: '',
      pointerEvents: '',
    },
    setAttribute: vi.fn(),
    focus: vi.fn(),
    select: vi.fn(),
  };
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  const execCommand = vi.fn().mockReturnValue(copyResult);

  vi.stubGlobal('document', {
    createElement: vi.fn().mockReturnValue(textArea),
    body: { appendChild, removeChild },
    execCommand,
  });

  return { textArea, appendChild, removeChild, execCommand };
};

describe('copyTextToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Clipboard API를 우선 사용한다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await copyTextToClipboard('https://example.com/share');

    expect(writeText).toHaveBeenCalledWith('https://example.com/share');
  });

  it('Clipboard API가 실패하면 textarea 복사로 폴백한다', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const fallback = stubFallbackDocument(true);

    await copyTextToClipboard('fallback text');

    expect(fallback.textArea.value).toBe('fallback text');
    expect(fallback.appendChild).toHaveBeenCalledWith(fallback.textArea);
    expect(fallback.execCommand).toHaveBeenCalledWith('copy');
    expect(fallback.removeChild).toHaveBeenCalledWith(fallback.textArea);
  });

  it('폴백 복사 실패를 호출자에게 전달하면서 임시 요소를 정리한다', async () => {
    vi.stubGlobal('navigator', {});
    const fallback = stubFallbackDocument(false);

    await expect(copyTextToClipboard('cannot copy')).rejects.toThrow(
      'Clipboard copy command failed',
    );
    expect(fallback.removeChild).toHaveBeenCalledWith(fallback.textArea);
  });
});
