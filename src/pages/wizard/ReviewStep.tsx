import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { listClasses, listCultures, listLineages } from '@/api/rulesets';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  applyBonuses,
  firstLevelHp,
  modifierOf,
  type AbilityKey,
} from './pointBuy';
import { RULESET_KEY, type WizardValues } from './schema';

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  NON_BINARY: 'Non-binary',
};

export function ReviewStep() {
  const { getValues } = useFormContext<WizardValues>();
  const v = getValues();

  const { data: lineages = [] } = useQuery({
    queryKey: ['lineages', RULESET_KEY],
    queryFn: () => listLineages(RULESET_KEY),
  });
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', RULESET_KEY],
    queryFn: () => listClasses(RULESET_KEY),
  });
  const { data: cultures = [] } = useQuery({
    queryKey: ['cultures', RULESET_KEY],
    queryFn: () => listCultures(RULESET_KEY),
  });

  const lineage = lineages.find((l) => l.key === v.lineage);
  const heritage = lineage?.heritages.find((h) => h.key === v.heritage);
  const cls = classes.find((c) => c.key === v.charClass);
  const culture = cultures.find((c) => c.key === v.culture);

  const finalAbilities = applyBonuses(
    v.abilities,
    v.bonusPlus2 as AbilityKey | '',
    v.bonusPlus1 as AbilityKey | '',
  );
  const conMod = modifierOf(finalAbilities.constitution);
  const hp = firstLevelHp(cls?.hitDie, conMod);

  return (
    <fieldset className="space-y-2">
      <legend className="text-2xl font-heading mb-4">Review</legend>
      <Row label="Name" value={v.name} />
      <Row label="Gender" value={GENDER_LABELS[v.gender] ?? v.gender} />
      {v.pronouns && <Row label="Pronouns" value={v.pronouns} />}
      {v.bio && <Row label="Bio" value={v.bio} multiline />}
      <Row label="Lineage" value={lineage?.displayName ?? v.lineage} />
      <Row label="Heritage" value={heritage?.displayName ?? v.heritage} />
      <Row label="Class" value={cls?.displayName ?? v.charClass} />
      <Row label="Culture" value={culture?.displayName ?? v.culture} />
      {hp !== null && <Row label="Hit Points (1st level)" value={String(hp)} />}
      <div className="pt-2">
        <h3 className="font-heading mb-1">Abilities</h3>
        <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITY_KEYS.map((key) => (
            <li key={key} className="text-center">
              <div className="text-sm text-muted-foreground">{ABILITY_LABELS[key]}</div>
              <div className="font-heading text-lg">{v.abilities[key]}</div>
            </li>
          ))}
        </ul>
      </div>
      <Row label="Portrait" value={v.portraitFile ? 'Selected' : 'None'} />
    </fieldset>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? 'flex flex-col' : 'flex gap-2'}>
      <span className="text-muted-foreground">{label}:</span>
      <span className={multiline ? 'whitespace-pre-wrap' : ''}>{value}</span>
    </div>
  );
}
