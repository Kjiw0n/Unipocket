import clsx from 'clsx';

import { CATEGORY_STYLES } from '@/types/category';

import type { Insight } from '@/lib/insight/types';

interface InsightCardProps {
  insight: Insight;
}

const severityStyle = {
  positive: {
    dot: 'bg-primary-strong',
    label: '좋은 흐름',
  },
  info: {
    dot: 'bg-label-alternative',
    label: '확인',
  },
  warning: {
    dot: 'bg-status-cautionary',
    label: '주의',
  },
  alert: {
    dot: 'bg-red-500',
    label: '높음',
  },
} as const;

const InsightCard = ({ insight }: InsightCardProps) => {
  const categoryStyle =
    insight.categoryId !== undefined
      ? CATEGORY_STYLES[insight.categoryId]
      : null;
  const style = severityStyle[insight.severity];

  return (
    <article className="rounded-modal-8 bg-cool-neutral-99 flex min-h-34 flex-1 flex-col justify-between px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={clsx('size-2 rounded-full', style.dot)} />
          <span className="caption1-medium text-label-alternative">
            {style.label}
          </span>
        </div>
        {categoryStyle && (
          <span
            className={clsx(
              'caption1-medium rounded-modal-6 shrink-0 px-2 py-1',
              categoryStyle.bg,
              categoryStyle.text,
            )}
          >
            카테고리
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="body1-normal-bold text-label-normal leading-snug">
          {insight.segments.map((segment, index) => (
            <span
              key={`${segment.text}-${index}`}
              className={segment.emphasis ? 'text-primary-strong' : undefined}
            >
              {segment.text}
            </span>
          ))}
        </h3>
        {insight.description && (
          <p className="body2-normal-medium text-label-alternative line-clamp-2">
            {insight.description}
          </p>
        )}
      </div>
    </article>
  );
};

export default InsightCard;
