import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  TOTAL_POINTS,
  applyBonuses,
  canDecrement,
  canIncrement,
  modifierOf,
  pointsRemaining,
  type AbilityKey,
} from './pointBuy';

function formatModifier(score: number): string {
  const m = modifierOf(score);
  if (m < 0) return `−${Math.abs(m)}`;
  return `+${m}`;
}
import type { WizardValues } from './schema';

export function StatsStep() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const abilities = useWatch<WizardValues, 'abilities'>({ control, name: 'abilities' });
  const plus2 = useWatch<WizardValues, 'bonusPlus2'>({ control, name: 'bonusPlus2' });
  const plus1 = useWatch<WizardValues, 'bonusPlus1'>({ control, name: 'bonusPlus1' });
  const remaining = pointsRemaining(abilities);
  const finalScores = applyBonuses(abilities, plus2 as AbilityKey | '', plus1 as AbilityKey | '');

  return (
    <fieldset className="space-y-4">
      <legend className="text-2xl font-heading mb-4">Abilities</legend>
      <p className={remaining === 0 ? 'text-primary' : 'text-foreground'}>
        Points remaining: <strong>{remaining}</strong> / {TOTAL_POINTS}
      </p>

      <div className="grid grid-cols-[3rem_auto_2.5rem_auto_3rem_3rem_4rem_3rem] gap-2 items-center text-sm text-muted-foreground px-1">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span className="text-center">+2</span>
        <span className="text-center">+1</span>
        <span className="text-right">Total</span>
        <span className="text-right">Mod</span>
      </div>

      <div className="space-y-2">
        {ABILITY_KEYS.map((key) => (
          <Controller
            key={key}
            control={control}
            name={`abilities.${key}` as const}
            render={({ field }) => {
              const score = field.value;
              return (
                <div className="grid grid-cols-[3rem_auto_2.5rem_auto_3rem_3rem_4rem_3rem] gap-2 items-center">
                  <span className="font-heading">{ABILITY_LABELS[key]}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!canDecrement(score)}
                    onClick={() => field.onChange(score - 1)}
                    aria-label={`Decrease ${ABILITY_LABELS[key]}`}
                  >
                    −
                  </Button>
                  <span
                    className="text-center font-heading text-lg"
                    data-testid={`score-${key}`}
                  >
                    {score}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!canIncrement(score, remaining)}
                    onClick={() => field.onChange(score + 1)}
                    aria-label={`Increase ${ABILITY_LABELS[key]}`}
                  >
                    +
                  </Button>
                  <input
                    type="checkbox"
                    checked={plus2 === key}
                    disabled={plus1 === key}
                    onChange={() =>
                      setValue('bonusPlus2', plus2 === key ? '' : key, {
                        shouldValidate: true,
                      })
                    }
                    aria-label={`+2 bonus to ${ABILITY_LABELS[key]}`}
                    className="justify-self-center accent-primary disabled:opacity-40"
                  />
                  <input
                    type="checkbox"
                    checked={plus1 === key}
                    disabled={plus2 === key}
                    onChange={() =>
                      setValue('bonusPlus1', plus1 === key ? '' : key, {
                        shouldValidate: true,
                      })
                    }
                    aria-label={`+1 bonus to ${ABILITY_LABELS[key]}`}
                    className="justify-self-center accent-primary disabled:opacity-40"
                  />
                  <span className="text-right font-heading text-lg">{finalScores[key]}</span>
                  <span
                    className="text-right font-heading text-lg"
                    data-testid={`mod-${key}`}
                  >
                    {formatModifier(finalScores[key])}
                  </span>
                </div>
              );
            }}
          />
        ))}
      </div>

      {(errors.bonusPlus2 || errors.bonusPlus1) && (
        <p role="alert" className="text-destructive text-sm">
          {errors.bonusPlus1?.message === 'Must be different abilities'
            ? 'Pick different abilities for the +2 and +1 bonuses.'
            : 'Pick a +2 and a +1 bonus.'}
        </p>
      )}
    </fieldset>
  );
}
