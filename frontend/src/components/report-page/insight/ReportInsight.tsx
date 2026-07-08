import { useMemo } from 'react';

import ReportContainer from '@/components/report-page/layout/ReportContainer';

import { type CurrencyType } from '@/types/currency';

import type { GetAnalysisResponse } from '@/api/account-books/type';
import { useGetExpensesQuery } from '@/api/expenses/query';
import { useWidgetQuery } from '@/api/widget/query';
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

  const insights = useMemo(() => {
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

  if (isPlaceholderData) {
    return <ReportInsightSkeleton />;
  }

  return (
    <div className="w-full min-w-283">
      <ReportContainer title="AI 소비 인사이트">
        <div className="flex gap-3.5">
          {insights.map((insight) => (
            <InsightCard key={insight.ruleId} insight={insight} />
          ))}
        </div>
      </ReportContainer>
    </div>
  );
};

export default ReportInsight;
