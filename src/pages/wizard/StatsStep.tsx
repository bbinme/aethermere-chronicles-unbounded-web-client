import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  TOTAL_POINTS,
  canDecrement,
  canIncrement,
  pointsRemaining,
} from './pointBuy';
import type { WizardValues } from './schema';

export function StatsStep() {
  const { control } = useFormContext<WizardValues>();
  const abilities = useWatch<WizardValues, 'abilities'>({ control, name: 'abilities' });
  const remaining = pointsRemaining(abilities);

  return (
    <fieldset>
      <legend className="text-2xl font-heading mb-4">Abilities</legend>
      <p className={remaining === 0 ? 'text-primary mb-4' : 'text-foreground mb-4'}>
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
                </div>
              );
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
