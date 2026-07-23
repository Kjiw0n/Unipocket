import { CATEGORIES } from '@/types/category';

import { COUNTRY_TIME_REGION, TIME_REGION_CONFIG } from '@/constants/time';
import type { CountryCode } from '@/data/country/countryCode';
import { formatAmountByCountry, getCountryInfo } from '@/lib/country';
import { getCurrentYearMonth } from '@/lib/insight/time';
import type { ReportSharePayload } from '@/lib/share/codec';

export interface ReportShareMetadataContent {
  title: string;
  description: string;
}

export const isCurrentMonthAtIssue = (
  issuedAt: string,
  year: number,
  month: number,
  localCountryCode: CountryCode,
): boolean => {
  const issuedDate = new Date(issuedAt);
  if (!Number.isFinite(issuedDate.getTime())) return false;

  const timeRegion = COUNTRY_TIME_REGION[localCountryCode] ?? 'DEFAULT';
  const issuedYearMonth = getCurrentYearMonth(
    issuedDate,
    TIME_REGION_CONFIG[timeRegion].timeZone,
  );

  return issuedYearMonth.year === year && issuedYearMonth.month === month;
};

export const buildReportShareMetadataContent = (
  payload: ReportSharePayload,
): ReportShareMetadataContent => {
  const countryCode =
    payload.currencyType === 'LOCAL'
      ? payload.localCountryCode
      : payload.baseCountryCode;
  const countryInfo = getCountryInfo(countryCode);
  const totalSpent = Number(
    payload.analysis.compareWithLastMonth.totalSpent.thisMonthToDate,
  );
  const formattedTotal = Number.isFinite(totalSpent)
    ? formatAmountByCountry(totalSpent, countryCode, 0)
    : payload.analysis.compareWithLastMonth.totalSpent.thisMonthToDate;
  const totalSummary = countryInfo
    ? `${formattedTotal}${countryInfo.currencyUnitKor}`
    : formattedTotal;

  const topCategory = payload.analysis.compareByCategory.items
    .filter(
      (item) => item.categoryIndex !== 9 && Number(item.mySpentAmount) > 0,
    )
    .reduce<
      (typeof payload.analysis.compareByCategory.items)[number] | null
    >((top, item) => (!top || Number(item.mySpentAmount) > Number(top.mySpentAmount) ? item : top), null);
  const categorySummary = topCategory
    ? ` 가장 많이 지출한 카테고리는 ${CATEGORIES[topCategory.categoryIndex].name}예요.`
    : '';

  return {
    title: `${payload.month}월 지출 리포트`,
    description: `${payload.year}년 ${payload.month}월 총지출은 ${totalSummary}이에요.${categorySummary}`,
  };
};
