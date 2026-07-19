import { compressToUint8Array, decompressFromUint8Array } from 'lz-string';

import type { CategoryId } from '@/types/category';
import type { CurrencyType } from '@/types/currency';

import type {
  AnalysisCategoryItem,
  AnalysisChartItem,
  GetAnalysisResponse,
} from '@/api/account-books/type';
import { type CountryCode, isCountryCode } from '@/data/country/countryCode';

export interface ReportSharePayload {
  v: 1;
  year: number;
  month: number;
  currencyType: CurrencyType;
  localCountryCode: CountryCode;
  baseCountryCode: CountryCode;
  issuedAt: string;
  analysis: GetAnalysisResponse;
}

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const CATEGORY_IDS = new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const MAX_CHART_ITEMS = 366;
const MAX_CATEGORY_ITEMS = 10;
const MAX_DECOMPRESSED_LENGTH = 100_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBoundedString = (value: unknown, maxLength = 100): value is string =>
  typeof value === 'string' && value.length <= maxLength;

const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const parseCategoryId = (value: unknown): CategoryId | null =>
  Number.isInteger(value) && CATEGORY_IDS.has(Number(value))
    ? (Number(value) as CategoryId)
    : null;

const parseChartItems = (value: unknown): AnalysisChartItem[] | null => {
  if (!Array.isArray(value) || value.length > MAX_CHART_ITEMS) return null;

  const result: AnalysisChartItem[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      !isBoundedString(item.date, 40) ||
      !isBoundedString(item.cumulatedAmount)
    ) {
      return null;
    }
    result.push({ date: item.date, cumulatedAmount: item.cumulatedAmount });
  }
  return result;
};

const parseCategoryItems = (value: unknown): AnalysisCategoryItem[] | null => {
  if (!Array.isArray(value) || value.length > MAX_CATEGORY_ITEMS) return null;

  const result: AnalysisCategoryItem[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const categoryIndex = parseCategoryId(item.categoryIndex);
    if (
      categoryIndex === null ||
      !isBoundedString(item.mySpentAmount) ||
      !isBoundedString(item.averageSpentAmount)
    ) {
      return null;
    }
    result.push({
      categoryIndex,
      mySpentAmount: item.mySpentAmount,
      averageSpentAmount: item.averageSpentAmount,
    });
  }
  return result;
};

const parseAnalysis = (value: unknown): GetAnalysisResponse | null => {
  if (!isRecord(value)) return null;
  const average = value.compareWithAverage;
  const lastMonth = value.compareWithLastMonth;
  const category = value.compareByCategory;
  if (!isRecord(average) || !isRecord(lastMonth) || !isRecord(category))
    return null;

  const totalSpent = lastMonth.totalSpent;
  const thisMonthItem = parseChartItems(lastMonth.thisMonthItem);
  const prevMonthItem = parseChartItems(lastMonth.prevMonthItem);
  const categoryItems = parseCategoryItems(category.items);
  const maxDiffCategoryIndex = parseCategoryId(category.maxDiffCategoryIndex);

  if (
    !isBoundedString(value.countryCode, 2) ||
    !COUNTRY_CODE_PATTERN.test(value.countryCode) ||
    !Number.isInteger(average.month) ||
    Number(average.month) < 1 ||
    Number(average.month) > 12 ||
    !isBoundedString(average.mySpentAmount) ||
    !isBoundedString(average.averageSpentAmount) ||
    !isBoundedString(average.spentAmountDiff) ||
    !isBoundedString(lastMonth.diff) ||
    !isBoundedString(lastMonth.thisMonth, 20) ||
    !isNonNegativeInteger(lastMonth.thisMonthCount) ||
    !isBoundedString(lastMonth.lastMonth, 20) ||
    !isNonNegativeInteger(lastMonth.lastMonthCount) ||
    !isRecord(totalSpent) ||
    !isBoundedString(totalSpent.thisMonthToDate) ||
    !isBoundedString(totalSpent.lastMonthTotal) ||
    !isBoundedString(lastMonth.thisMonthSpent) ||
    !thisMonthItem ||
    !prevMonthItem ||
    maxDiffCategoryIndex === null ||
    typeof category.isOverSpent !== 'boolean' ||
    !isBoundedString(category.maxLabel, 100) ||
    !categoryItems
  ) {
    return null;
  }

  return {
    countryCode: value.countryCode,
    compareWithAverage: {
      month: Number(average.month),
      mySpentAmount: average.mySpentAmount,
      averageSpentAmount: average.averageSpentAmount,
      spentAmountDiff: average.spentAmountDiff,
    },
    compareWithLastMonth: {
      diff: lastMonth.diff,
      thisMonth: lastMonth.thisMonth,
      thisMonthCount: Number(lastMonth.thisMonthCount),
      lastMonth: lastMonth.lastMonth,
      lastMonthCount: Number(lastMonth.lastMonthCount),
      totalSpent: {
        thisMonthToDate: totalSpent.thisMonthToDate,
        lastMonthTotal: totalSpent.lastMonthTotal,
      },
      thisMonthSpent: lastMonth.thisMonthSpent,
      thisMonthItem,
      prevMonthItem,
    },
    compareByCategory: {
      maxDiffCategoryIndex,
      isOverSpent: category.isOverSpent,
      maxLabel: category.maxLabel,
      items: categoryItems,
    },
  };
};

export const parseReportSharePayload = (
  value: unknown,
): ReportSharePayload | null => {
  if (!isRecord(value)) return null;
  const analysis = parseAnalysis(value.analysis);
  const localCountryCode = isCountryCode(value.localCountryCode)
    ? value.localCountryCode
    : null;
  const baseCountryCode = isCountryCode(value.baseCountryCode)
    ? value.baseCountryCode
    : null;
  if (
    value.v !== 1 ||
    !Number.isInteger(value.year) ||
    Number(value.year) < 2000 ||
    Number(value.year) > 2100 ||
    !Number.isInteger(value.month) ||
    Number(value.month) < 1 ||
    Number(value.month) > 12 ||
    (value.currencyType !== 'BASE' && value.currencyType !== 'LOCAL') ||
    !localCountryCode ||
    !baseCountryCode ||
    !isBoundedString(value.issuedAt, 40) ||
    !analysis
  ) {
    return null;
  }

  return {
    v: 1,
    year: Number(value.year),
    month: Number(value.month),
    currencyType: value.currencyType,
    localCountryCode,
    baseCountryCode,
    issuedAt: value.issuedAt,
    analysis,
  };
};

export const encodeReportSharePayload = (payload: ReportSharePayload): string =>
  Buffer.from(compressToUint8Array(JSON.stringify(payload))).toString(
    'base64url',
  );

export const decodeReportSharePayload = (encoded: string): unknown => {
  if (!encoded || !BASE64URL_PATTERN.test(encoded)) {
    throw new Error('Invalid base64url payload');
  }

  const compressed = Buffer.from(encoded, 'base64url');
  const json = decompressFromUint8Array(new Uint8Array(compressed));
  if (!json || json.length > MAX_DECOMPRESSED_LENGTH) {
    throw new Error('Invalid compressed payload');
  }

  return JSON.parse(json) as unknown;
};
