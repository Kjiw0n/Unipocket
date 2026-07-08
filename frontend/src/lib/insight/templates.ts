import { CATEGORIES } from '@/types/category';

import type { InsightCandidate, InsightRuleId } from './types';

type Template = {
  title: (params: InsightCandidate['params']) => string;
  emphasis: (params: InsightCandidate['params']) => string[];
  description?: (params: InsightCandidate['params']) => string;
};

const templates: Record<InsightRuleId, Template[]> = {
  'category-overspend': [
    {
      title: (p) => `${p.category}에 평균보다 ${p.pct}% 더 쓰고 계세요`,
      emphasis: (p) => ['평균보다', `${p.pct}%`],
      description: (p) =>
        `이번 달 ${p.category} 지출이 전체 지출에서 크게 보여요.`,
    },
    {
      title: (p) => `${p.category} 지출이 평균 대비 ${p.pct}% 높아요`,
      emphasis: (p) => ['평균 대비', `${p.pct}%`],
      description: () => '자주 반복되는 결제부터 한 번만 줄여도 효과가 커요.',
    },
  ],
  'category-surge': [
    {
      title: (p) => `지난달보다 ${p.category} 지출이 ${p.pct}% 늘었어요`,
      emphasis: (p) => [`${p.pct}%`, '늘었어요'],
      description: (p) => `${p.amount}${p.unit} 차이가 났어요.`,
    },
    {
      title: (p) => `${p.category} 지출 증가폭이 ${p.pct}%예요`,
      emphasis: (p) => [`${p.pct}%`],
      description: () => '이번 달에 새로 늘어난 소비 패턴인지 확인해보세요.',
    },
  ],
  'monthly-pace': [
    {
      title: (p) =>
        `지난달 같은 날짜보다 ${p.amount}${p.unit} ${p.direction} 쓰는 중이에요`,
      emphasis: (p) => [`${p.amount}${p.unit}`, `${p.direction}`],
      description: (p) => String(p.description),
    },
    {
      title: (p) => `전월 대비 페이스가 ${p.pct}% ${p.direction} 가고 있어요`,
      emphasis: (p) => [`${p.pct}%`, `${p.direction}`],
      description: (p) => String(p.description),
    },
  ],
  'budget-burn': [
    {
      title: (p) =>
        p.paceStatus === 'slow'
          ? `예산의 ${p.spentPct}%만 사용했어요`
          : `예산의 ${p.spentPct}%를 벌써 썼어요`,
      emphasis: (p) => [`${p.spentPct}%`],
      description: (p) =>
        p.paceStatus === 'slow'
          ? '계획보다 여유 있게 쓰고 있어요.'
          : `지금 속도면 ${p.predictedDay}일쯤 예산에 닿아요.`,
    },
    {
      title: (p) =>
        p.paceStatus === 'slow'
          ? `예산 사용 속도가 계획보다 ${p.pacePct}% 여유 있어요`
          : `예산 사용 속도가 계획보다 ${p.pacePct}% 빨라요`,
      emphasis: (p) => [`${p.pacePct}%`],
      description: (p) =>
        p.paceStatus === 'slow'
          ? `현재까지 ${p.spentPct}%만 사용했어요.`
          : `현재까지 ${p.spentPct}%를 사용했어요.`,
    },
  ],
  'weekly-trend': [
    {
      title: () => `지출이 3주 연속 늘고 있어요`,
      emphasis: () => ['3주 연속'],
      description: (p) => `첫 주보다 ${p.pct}% 증가했어요.`,
    },
    {
      title: (p) => `주간 지출 흐름이 ${p.pct}% 올라갔어요`,
      emphasis: (p) => [`${p.pct}%`],
      description: () => '최근 주차 지출을 한 번 점검해보세요.',
    },
  ],
  'repeat-merchant': [
    {
      title: (p) => `${p.merchant}에 이번 달 ${p.count}번 방문했어요`,
      emphasis: (p) => [`${p.count}번`],
      description: (p) => `총 ${p.amount}${p.unit} 사용했어요.`,
    },
    {
      title: (p) => `${p.merchant} 지출이 반복되고 있어요`,
      emphasis: (p) => [String(p.merchant)],
      description: (p) => `${p.count}번 결제로 ${p.amount}${p.unit}을 썼어요.`,
    },
  ],
  'cash-card-shift': [
    {
      title: (p) => `현금 사용 비중이 ${p.delta}%p ${p.direction}`,
      emphasis: (p) => [`${p.delta}%p`],
      description: () =>
        '현금 지출은 기록 누락이 쉬우니 한 번 더 확인해보세요.',
    },
    {
      title: (p) => `결제 수단 흐름이 현금 쪽으로 ${p.delta}%p 움직였어요`,
      emphasis: (p) => [`${p.delta}%p`],
      description: (p) => `지난달보다 현금 비중이 ${p.direction}.`,
    },
  ],
  'weekday-pattern': [
    {
      title: (p) => `${p.weekday} 지출 비중이 ${p.pct}%예요`,
      emphasis: (p) => [`${p.weekday}`, `${p.pct}%`],
      description: () => '특정 요일에 소비가 몰리는 패턴이 보여요.',
    },
    {
      title: (p) => `${p.weekday}마다 지갑이 자주 열려요`,
      emphasis: (p) => [`${p.weekday}`],
      description: (p) => `이번 달 지출의 ${p.pct}%가 이 요일에 몰렸어요.`,
    },
  ],
  'anomaly-expense': [
    {
      title: (p) => `${p.date} ${p.merchant}에서 큰 지출이 있었어요`,
      emphasis: (p) => [String(p.merchant)],
      description: (p) =>
        `${p.amount}${p.unit}으로 이번 달 평소 지출보다 컸어요.`,
    },
    {
      title: (p) => `${p.amount}${p.unit} 단일 지출이 눈에 띄어요`,
      emphasis: (p) => [`${p.amount}${p.unit}`],
      description: (p) => `${p.date} ${p.merchant} 결제예요.`,
    },
  ],
  'no-spend-streak': [
    {
      title: (p) => `${p.days}일 연속 무지출에 성공했어요`,
      emphasis: (p) => [`${p.days}일 연속`],
      description: () => '좋은 흐름을 유지하고 있어요.',
    },
    {
      title: (p) => `무지출 기록이 ${p.days}일까지 이어졌어요`,
      emphasis: (p) => [`${p.days}일`],
      description: () => '이번 달 절약 흐름이 분명해요.',
    },
  ],
  'uncategorized-nudge': [
    {
      title: (p) => `미분류 지출이 ${p.count}건 있어요`,
      emphasis: (p) => [`${p.count}건`],
      description: () => '카테고리를 정리하면 리포트가 더 정확해져요.',
    },
    {
      title: (p) => `지출 ${p.pct}%가 아직 미분류예요`,
      emphasis: (p) => [`${p.pct}%`],
      description: () => '몇 건만 정리해도 인사이트 품질이 좋아져요.',
    },
  ],
  'small-frequent': [
    {
      title: (p) => `작은 지출이 모여 ${p.amount}${p.unit}이 됐어요`,
      emphasis: (p) => [`${p.amount}${p.unit}`],
      description: (p) => `${p.count}건의 소액 결제가 누적됐어요.`,
    },
    {
      title: (p) => `소액 결제 합계가 전체의 ${p.pct}%예요`,
      emphasis: (p) => [`${p.pct}%`],
      description: () => '작은 결제가 자주 반복되는지 살펴보세요.',
    },
  ],
  'category-saving': [
    {
      title: (p) => `${p.category}는 평균보다 ${p.pct}% 아끼고 있어요`,
      emphasis: (p) => [`${p.pct}%`, '아끼고'],
      description: () => '절약이 잘 유지되는 카테고리예요.',
    },
    {
      title: (p) => `${p.category} 지출 관리가 좋아요`,
      emphasis: (p) => [String(p.category)],
      description: (p) => `같은 국가 평균보다 ${p.pct}% 낮아요.`,
    },
  ],
  'starter-fallback': [
    {
      title: (p) => `지출을 ${p.count}건만 더 기록하면 인사이트가 열려요`,
      emphasis: (p) => [`${p.count}건`],
      description: () => '아직 데이터가 조금 부족해요.',
    },
  ],
};

const hash = (value: string): number =>
  [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);

const splitEmphasis = (text: string, emphasis: string[]) => {
  const matched = emphasis.filter(Boolean).sort((a, b) => b.length - a.length);
  if (matched.length === 0) return [{ text, emphasis: false }];

  const segments: { text: string; emphasis: boolean }[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = matched
      .map((word) => ({ word, index: text.indexOf(word, cursor) }))
      .filter(({ index }) => index >= 0)
      .sort((a, b) => a.index - b.index)[0];

    if (!found) {
      segments.push({ text: text.slice(cursor), emphasis: false });
      break;
    }

    if (found.index > cursor) {
      segments.push({ text: text.slice(cursor, found.index), emphasis: false });
    }
    segments.push({ text: found.word, emphasis: true });
    cursor = found.index + found.word.length;
  }

  return segments;
};

export const renderInsightTemplate = (
  candidate: InsightCandidate,
  year: number,
  month: number,
) => {
  const variants = templates[candidate.ruleId];
  const template =
    variants[hash(`${candidate.ruleId}-${year}-${month}`) % variants.length];
  const title = template.title(candidate.params);

  return {
    segments: splitEmphasis(title, template.emphasis(candidate.params)),
    description: candidate.params.partial
      ? `${template.description?.(candidate.params) ?? ''} 일부 데이터 기준이에요.`
      : template.description?.(candidate.params),
  };
};

export const getCategoryName = (categoryId: number) =>
  CATEGORIES[categoryId as keyof typeof CATEGORIES]?.name ?? '해당 카테고리';
