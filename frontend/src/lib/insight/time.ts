export const getCurrentYearMonth = (
  date = new Date(),
  timeZone = 'Asia/Seoul',
) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
};

export const compareYearMonth = (
  left: { year: number; month: number },
  right: { year: number; month: number },
) => left.year * 12 + left.month - (right.year * 12 + right.month);
