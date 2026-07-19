'use client';

import { createContext, useContext } from 'react';

import type { CountryCode } from '@/data/country/countryCode';

export interface ReportDataContextValue {
  localCountryCode: CountryCode;
  baseCountryCode: CountryCode;
}

export const ReportDataContext = createContext<ReportDataContextValue | null>(
  null,
);

export const useReportDataContext = () => {
  const context = useContext(ReportDataContext);

  if (!context) {
    throw new Error('ReportDataContext is missing in provider tree');
  }

  return context;
};
