import { describe, expect, it } from 'vitest';

import { renderInsightTemplate } from '@/lib/insight/templates';
import type { InsightCandidate } from '@/lib/insight/types';

const buildCandidate = (
  overrides: Partial<InsightCandidate> = {},
): InsightCandidate => ({
  ruleId: 'monthly-pace',
  severity: 'warning',
  magnitude: 0.5,
  params: {
    amount: '25,000',
    unit: '원',
    direction: '더',
    pct: 25,
    description: '남은 기간에는 고정 지출과 반복 지출을 점검해보세요.',
  },
  ...overrides,
});

describe('Insight Templates', () => {
  it('같은 ruleId-year-month 조합이면 같은 템플릿 변형을 선택한다', () => {
    const candidate = buildCandidate();

    expect(renderInsightTemplate(candidate, 2026, 7)).toEqual(
      renderInsightTemplate(candidate, 2026, 7),
    );
  });

  it('partial 파라미터가 있으면 일부 데이터 기준 설명을 덧붙인다', () => {
    const result = renderInsightTemplate(
      buildCandidate({ params: { ...buildCandidate().params, partial: 1 } }),
      2026,
      7,
    );

    expect(result.description).toContain('일부 데이터 기준');
  });
});
