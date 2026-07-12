'use client';

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <p>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
        <button onClick={reset}>다시 시도</button>
      </body>
    </html>
  );
}
