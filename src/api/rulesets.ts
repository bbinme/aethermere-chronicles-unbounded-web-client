import { apiFetch } from './client';
import type {
  ClassResponse,
  ClassesWrapper,
  CultureResponse,
  CulturesWrapper,
  LineageResponse,
  LineagesWrapper,
  RulesetSummary,
} from './types';

export const listRulesets = () => apiFetch<RulesetSummary[]>('/api/rulesets');

export const listLineages = (rulesetKey: string): Promise<LineageResponse[]> =>
  apiFetch<LineagesWrapper>(`/api/rulesets/${encodeURIComponent(rulesetKey)}/lineages`).then(
    (w) => w.lineages ?? [],
  );

export const listClasses = (rulesetKey: string): Promise<ClassResponse[]> =>
  apiFetch<ClassesWrapper>(`/api/rulesets/${encodeURIComponent(rulesetKey)}/classes`).then(
    (w) => w.classes ?? [],
  );

export const listCultures = (rulesetKey: string): Promise<CultureResponse[]> =>
  apiFetch<CulturesWrapper>(`/api/rulesets/${encodeURIComponent(rulesetKey)}/cultures`).then(
    (w) => w.cultures ?? [],
  );
