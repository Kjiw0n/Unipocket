import { useEffect, useRef } from 'react';

import Modal from '@/components/modal/Modal';

interface ReportShareFallbackModalProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
  onCopy: () => Promise<void>;
}

const ReportShareFallbackModal = ({
  isOpen,
  url,
  onClose,
  onCopy,
}: ReportShareFallbackModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isOpen, url]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onAction={onCopy}
      cancelButton={{ label: '닫기' }}
      confirmButton={{ label: '링크 복사', variant: 'solid' }}
    >
      <div className="flex w-100 max-w-[calc(100vw-2rem)] flex-col gap-6 px-2">
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-label-normal headline1-bold text-center">
            공유 링크를 직접 복사해주세요
          </h2>
          <p className="text-label-alternative body1-normal-medium text-center">
            자동 복사가 제한된 브라우저예요.
            <br />
            링크를 길게 누르거나 전체 선택한 뒤 복사해주세요.
            <br />
            키보드에서는 Ctrl+C 또는 ⌘+C를 사용할 수 있어요.
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          aria-label="공유 링크"
          spellCheck={false}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          className="border-line-normal-neutral text-label-normal body2-normal-regular focus:border-primary-normal rounded-modal-10 h-12 w-full border px-3 outline-none"
        />
      </div>
    </Modal>
  );
};

export default ReportShareFallbackModal;
