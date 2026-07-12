import { useMemo } from 'react';

import ReportContainer from '@/components/report-page/layout/ReportContainer';

import { type CurrencyType } from '@/types/currency';

import type { GetAnalysisResponse } from '@/api/account-books/type';
import { useGetExpensesQuery } from '@/api/expenses/query';
import { useInsightSummaryQuery } from '@/api/insights/query';
import { useWidgetQuery } from '@/api/widget/query';
import { COUNTRY_TIME_REGION, TIME_REGION_CONFIG } from '@/constants/time';
import type { CountryCode } from '@/data/country/countryCode';
import { formatAmountByCountry, getCountryInfo } from '@/lib/country';
import { runInsightEngine } from '@/lib/insight/engine';
import {
  buildExpenseFilter,
  buildInsightDateMeta,
  getPreviousYearMonth,
  isPartialExpenseResponse,
  normalizeBudget,
  normalizeExpenses,
} from '@/lib/insight/normalize';
import {
  buildInsightSummaryFacts,
  hasMeaningfulInsights,
} from '@/lib/insight/summary';
import { compareYearMonth, getCurrentYearMonth } from '@/lib/insight/time';
import {
  useAccountBookCountryCode,
  useRequiredAccountBook,
} from '@/stores/accountBookStore';

import InsightCard from './InsightCard';
import ReportInsightSkeleton from './ReportInsightSkeleton';

interface ReportInsightProps {
  analysis: GetAnalysisResponse;
  year: number;
  month: number;
  isCurrentMonth: boolean;
  isPlaceholderData: boolean;
  currencyType: CurrencyType;
}

const ReportInsight = ({
  analysis,
  year,
  month,
  isCurrentMonth,
  isPlaceholderData,
  currencyType,
}: ReportInsightProps) => {
  const accountBook = useRequiredAccountBook();
  const displayCountryCode = useAccountBookCountryCode(currencyType);
  const previous = getPreviousYearMonth(year, month);

  const thisMonthResponse = useGetExpensesQuery(
    accountBook.accountBookId,
    buildExpenseFilter(year, month),
  );
  const lastMonthResponse = useGetExpensesQuery(
    accountBook.accountBookId,
    buildExpenseFilter(previous.year, previous.month),
  );
  const { data: budgetData } = useWidgetQuery('BUDGET', {
    currencyType,
    enabled: isCurrentMonth,
  });

  const insightResult = useMemo(() => {
    const today = new Date();
    const { daysInMonth, elapsedDays } = buildInsightDateMeta(
      year,
      month,
      isCurrentMonth,
      today,
    );
    const unit = getCountryInfo(displayCountryCode)?.currencyUnitKor ?? '';

    return runInsightEngine({
      year,
      month,
      isCurrentMonth,
      today,
      daysInMonth,
      elapsedDays,
      currencyType,
      analysis,
      thisMonthExpenses: normalizeExpenses(
        thisMonthResponse.data.expenses,
        currencyType,
      ),
      lastMonthExpenses: normalizeExpenses(
        lastMonthResponse.data.expenses,
        currencyType,
      ),
      budget: normalizeBudget(budgetData, currencyType),
      formatAmount: (amount) =>
        formatAmountByCountry(amount, displayCountryCode, 0),
      unit,
      isPartialExpenseData:
        isPartialExpenseResponse(thisMonthResponse.data) ||
        isPartialExpenseResponse(lastMonthResponse.data),
    });
  }, [
    analysis,
    budgetData,
    currencyType,
    displayCountryCode,
    isCurrentMonth,
    lastMonthResponse.data,
    month,
    thisMonthResponse.data,
    year,
  ]);
  const summaryRequest = useMemo(
    () => ({
      accountBookId: accountBook.accountBookId,
      year,
      month,
      currencyType,
      facts: buildInsightSummaryFacts(insightResult.fired),
    }),
    [accountBook.accountBookId, currencyType, insightResult.fired, month, year],
  );
  const summaryEnabled =
    !isPlaceholderData && hasMeaningfulInsights(insightResult.fired);
  const isPastMonth = useMemo(() => {
    const timeRegion = accountBook.localCountryCode
      ? COUNTRY_TIME_REGION[accountBook.localCountryCode as CountryCode]
      : undefined;
    const timeZone = TIME_REGION_CONFIG[timeRegion ?? 'DEFAULT'].timeZone;
    return (
      compareYearMonth(
        { year, month },
        getCurrentYearMonth(new Date(), timeZone),
      ) < 0
    );
  }, [accountBook.localCountryCode, year, month]);
  const summaryQuery = useInsightSummaryQuery(
    summaryRequest,
    summaryEnabled,
    isPastMonth,
  );

  if (isPlaceholderData) {
    return <ReportInsightSkeleton />;
  }

  return (
    <div className="w-full min-w-283">
      <ReportContainer title="AI 소비 인사이트">
        {summaryEnabled && summaryQuery.isPending && (
          <div className="flex flex-col gap-2 px-2.5 py-2">
            <div className="bg-fill-strong rounded-modal-4 h-4 w-24 animate-pulse" />
            <div className="bg-fill-normal rounded-modal-4 h-4 w-full animate-pulse" />
            <div className="bg-fill-normal rounded-modal-4 h-4 w-4/5 animate-pulse" />
          </div>
        )}
        {summaryEnabled &&
          !summaryQuery.isError &&
          summaryQuery.data?.summary && (
            <div className="flex flex-col gap-1 px-2.5 py-2">
              <h3 className="body2-normal-bold text-label-normal">
                이번 달 요약
              </h3>
              <p className="body2-normal-medium text-label-alternative leading-relaxed">
                {summaryQuery.data.summary}
              </p>
            </div>
          )}
        <div className="flex gap-3.5">
          {insightResult.top.map((insight) => (
            <InsightCard key={insight.ruleId} insight={insight} />
          ))}
        </div>
      </ReportContainer>
    </div>
  );
};

export default ReportInsight;
