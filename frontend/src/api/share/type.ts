import type { CurrencyType } from '@/types/currency';

export interface CreateReportShareRequest {
  accountBookId: number;
  year: number;
  month: number;
  currencyType: CurrencyType;
}

export interface CreateReportShareResponse {
  url: string;
}
