import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  TOTAL_POINTS,
  applyBonuses,
  canDecrement,
  canIncrement,
  pointsRemaining,
  type AbilityKey,
} from './pointBuy';
import type { WizardValues } from './schema';

export function StatsStep() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const abilities = useWatch<WizardValues, 'abilities'>({ control, name: 'abilities' });
  const plus2 = useWatch<WizardValues, 'bonusPlus2'>({ control, name: 'bonusPlus2' });
  const plus1 = useWatch<WizardValues, 'bonusPlus1'>({ control, name: 'bonusPlus1' });
  const remaining = pointsRemaining(abilities);
  const finalScores = applyBonuses(abilities, plus2 as AbilityKey | '', plus1 as AbilityKey | '');

  return (
    <fieldset className="space-y-6">
      <legend className="text-2xl font-heading mb-4">Abilities</legend>
      <p className={remaining === 0 ? 'text-primary' : 'text-foreground'}>
        Points remaining: <strong>{remaining}</strong> / {TOTAL_POINTS}
      </p>

      <div className="space-y-3">
        {ABILITY_KEYS.map((key) => (
          <Controller
            key={key}
            control={control}
            name={`abilities.${key}` as const}
            render={({ field }) => {
              const score = field.value;
              const bonus = (plus2 === key ? 2 : 0) + (plus1 === key ? 1 : 0);
              return (
                <div className="flex items-center gap-4">
                  <span className="w-12 font-heading">{ABILITY_LABELS[key]}</span>
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
                    className="w-8 text-center font-heading text-lg"
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
                  {bonus > 0 && (
                    <span className="text-primary text-sm">+{bonus}</span>
                  )}
                  <span className="ml-auto text-muted-foreground text-sm">
                    Total: <strong className="text-foreground">{finalScores[key]}</strong>
                  </span>
                </div>
              );
            }}
          />
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <h3 className="font-heading text-lg text-primary">Bonus Allocation</h3>
        <Controller
          control={control}
          name="bonusPlus2"
          render={({ field, fieldState }) => (
            <div className="flex items-center gap-3">
              <Label htmlFor="bonus-plus-2" className="w-24">+2 bonus to</Label>
              <select
                id="bonus-plus-2"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                className="border border-input rounded-md p-2 bg-background"
              >
                <option value="">— Select —</option>
                {ABILITY_KEYS.map((k) => (
                  <option key={k} value={k}>{ABILITY_LABELS[k]}</option>
                ))}
              </select>
              {fieldState.error && (
                <span role="alert" className="text-destructive text-sm">{fieldState.error.message}</span>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="bonusPlus1"
          render={({ field, fieldState }) => (
            <div className="flex items-center gap-3">
              <Label htmlFor="bonus-plus-1" className="w-24">+1 bonus to</Label>
              <select
                id="bonus-plus-1"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                className="border border-input rounded-md p-2 bg-background"
              >
                <option value="">— Select —</option>
                {ABILITY_KEYS.map((k) => (
                  <option key={k} value={k}>{ABILITY_LABELS[k]}</option>
                ))}
              </select>
              {fieldState.error && (
                <span role="alert" className="text-destructive text-sm">{fieldState.error.message}</span>
              )}
            </div>
          )}
        />
        {errors.bonusPlus1?.message === 'Must be different abilities' && (
          <p role="alert" className="text-destructive text-sm">Must be different abilities</p>
        )}
      </div>
    </fieldset>
  );
}
