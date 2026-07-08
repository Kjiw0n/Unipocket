import { FALLBACK_RULE, INSIGHT_RULES } from './rules';
import { sum } from './stats';
import { renderInsightTemplate } from './templates';
import type {
  Insight,
  InsightCandidate,
  InsightInput,
  InsightRule,
  InsightSeverity,
} from './types';

const SEVERITY_WEIGHT: Record<InsightSeverity, number> = {
  alert: 1,
  warning: 0.85,
  info: 0.62,
  positive: 0.68,
};

const CATEGORY_DEPENDENT_RULES = new Set([
  'category-overspend',
  'category-surge',
  'category-saving',
]);

const RAW_EXPENSE_DEPENDENT_RULES = new Set([
  'category-surge',
  'weekly-trend',
  'repeat-merchant',
  'cash-card-shift',
  'weekday-pattern',
  'anomaly-expense',
  'no-spend-streak',
  'small-frequent',
]);

const NO_INSIGHT_FALLBACK: InsightCandidate = {
  ruleId: 'no-insight-fallback',
  severity: 'info',
  magnitude: 0.1,
  params: {},
};

const meetsRequirement = (rule: InsightRule, input: InsightInput): boolean => {
  const requirement = rule.minDataRequirement;
  if (
    requirement.minTxCount &&
    input.thisMonthExpenses.length < requirement.minTxCount
  )
    return false;
  if (requirement.needsLastMonth && input.lastMonthExpenses.length === 0)
    return false;
  if (requirement.needsBudget && !input.budget) return false;
  if (requirement.currentMonthOnly && !input.isCurrentMonth) return false;
  return true;
};

const getScore = (candidate: InsightCandidate, input: InsightInput): number => {
  const uncategorizedCount = input.thisMonthExpenses.filter(
    (expense) => expense.category === 0,
  ).length;
  const uncategorizedRatio =
    input.thisMonthExpenses.length > 0
      ? uncategorizedCount / input.thisMonthExpenses.length
      : 0;
  const categoryPenalty =
    uncategorizedRatio >= 0.3 && CATEGORY_DEPENDENT_RULES.has(candidate.ruleId)
      ? 0.7
      : 1;

  return (
    SEVERITY_WEIGHT[candidate.severity] *
    (0.5 + 0.5 * candidate.magnitude) *
    categoryPenalty
  );
};

const suppressDuplicateCategory = (insights: Insight[]): Insight[] => {
  const seen = new Set<number>();
  return insights.filter((insight) => {
    if (insight.categoryId === undefined) return true;
    if (seen.has(insight.categoryId)) return false;
    seen.add(insight.categoryId);
    return true;
  });
};

const applyPositiveMix = (insights: Insight[]): Insight[] => {
  const topThree = insights.slice(0, 3);
  const allNegative =
    topThree.length === 3 &&
    topThree.every(
      (insight) =>
        insight.severity === 'warning' || insight.severity === 'alert',
    );
  if (!allNegative) return insights;

  const positiveIndex = insights.findIndex(
    (insight) => insight.severity === 'positive',
  );
  if (positiveIndex < 3 || positiveIndex === -1) return insights;

  const mixed = [...insights];
  const [positive] = mixed.splice(positiveIndex, 1);
  mixed.splice(2, 0, positive);
  return mixed;
};

const attachTemplate = (
  candidate: InsightCandidate,
  input: InsightInput,
): Insight => {
  const candidateWithMeta =
    input.isPartialExpenseData &&
    RAW_EXPENSE_DEPENDENT_RULES.has(candidate.ruleId)
      ? { ...candidate, params: { ...candidate.params, partial: 1 } }
      : candidate;
  const { segments, description } = renderInsightTemplate(
    candidateWithMeta,
    input.year,
    input.month,
  );
  return {
    ...candidateWithMeta,
    score: getScore(candidateWithMeta, input),
    segments,
    description,
  };
};

export const runInsightEngine = (input: InsightInput): Insight[] => {
  const total = sum(input.thisMonthExpenses.map((expense) => expense.amount));
  if (input.thisMonthExpenses.length < 5 || total <= 0) {
    const fallback = FALLBACK_RULE?.evaluate(input);
    return fallback ? [attachTemplate(fallback, input)] : [];
  }

  const insights = INSIGHT_RULES.filter(
    (rule) => rule.id !== 'starter-fallback',
  )
    .filter((rule) => meetsRequirement(rule, input))
    .map((rule) => rule.evaluate(input))
    .filter((candidate): candidate is InsightCandidate => candidate !== null)
    .map((candidate) => attachTemplate(candidate, input))
    .sort((a, b) => b.score - a.score);

  const ranked = applyPositiveMix(suppressDuplicateCategory(insights));
  if (ranked.length === 0) {
    return [attachTemplate(NO_INSIGHT_FALLBACK, input)];
  }

  return ranked.slice(0, 3);
};
