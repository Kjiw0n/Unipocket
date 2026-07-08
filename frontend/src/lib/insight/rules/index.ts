import { behaviorRules } from './behavior.rules';
import { categoryRules } from './category.rules';
import { paceRules } from './pace.rules';
import { qualityRules } from './quality.rules';

export const INSIGHT_RULES = [
  ...categoryRules,
  ...paceRules,
  ...behaviorRules,
  ...qualityRules,
];

export const FALLBACK_RULE = qualityRules.find(
  (rule) => rule.id === 'starter-fallback',
);
