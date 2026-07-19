'use client';

import { ReportDataContext } from '@/components/report-page/ReportDataContext';
import ReportSection from '@/components/report-page/ReportSection';

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
    payload.localCountryCode,
  );

  return (
    <ReportDataContext.Provider
      value={{
        localCountryCode: payload.localCountryCode,
        baseCountryCode: payload.baseCountryCode,
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
