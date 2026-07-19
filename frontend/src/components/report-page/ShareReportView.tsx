'use client';

import { ReportDataContext } from '@/components/report-page/ReportDataContext';
import ReportSection from '@/components/report-page/ReportSection';

import type { CountryCode } from '@/data/country/countryCode';
import type { ReportSharePayload } from '@/lib/share/codec';
import { isCurrentMonthAtIssue } from '@/lib/share/presentation';

interface ShareReportViewProps {
  payload: ReportSharePayload;
}

const keepSnapshotCurrency = () => undefined;

const ShareReportView = ({ payload }: ShareReportViewProps) => {
  const isCurrentMonth = isCurrentMonthAtIssue(
    payload.issuedAt,
    payload.year,
    payload.month,
  );

  return (
    <ReportDataContext.Provider
      value={{
        localCountryCode: payload.localCountryCode as CountryCode,
        baseCountryCode: payload.baseCountryCode as CountryCode,
      }}
    >
      <ReportSection
        data={payload.analysis}
        currencyType={payload.currencyType}
        onCurrencyTypeChange={keepSnapshotCurrency}
        isCurrentMonth={isCurrentMonth}
        isPlaceholderData={false}
      />
    </ReportDataContext.Provider>
  );
};

export default ShareReportView;
