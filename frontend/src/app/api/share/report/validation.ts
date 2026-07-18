import type { CurrencyType } from '@/types/currency';

export interface ShareReportRequest {
  accountBookId: number;
  year: number;
  month: number;
  currencyType: CurrencyType;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseShareReportRequest = (
  value: unknown,
): ShareReportRequest | null => {
  if (!isRecord(value)) return null;
  const { accountBookId, year, month, currencyType } = value;
  if (!Number.isInteger(accountBookId) || Number(accountBookId) <= 0)
    return null;
  if (!Number.isInteger(year) || Number(year) < 2000 || Number(year) > 2100)
    return null;
  if (!Number.isInteger(month) || Number(month) < 1 || Number(month) > 12)
    return null;
  if (currencyType !== 'BASE' && currencyType !== 'LOCAL') return null;

  return {
    accountBookId: Number(accountBookId),
    year: Number(year),
    month: Number(month),
    currencyType,
  };
};
