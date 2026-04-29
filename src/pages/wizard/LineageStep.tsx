import { useQuery } from '@tanstack/react-query';
import { Controller, useFormContext } from 'react-hook-form';
import { listLineages } from '@/api/rulesets';
import { RULESET_KEY, type WizardValues } from './schema';

const GRID_CELLS = [
  'r0_c0', 'r0_c1', 'r0_c2',
  'r1_c0', 'r1_c1', 'r1_c2',
  'r2_c0', 'r2_c1', 'r2_c2',
] as const;

const LINEAGE_ICONS_M = GRID_CELLS.map((c) => `/icons/lineages/apr12_${c}.png`);
const LINEAGE_ICONS_F = GRID_CELLS.map((c) => `/icons/lineages_f/apr28_${c}.png`);

export function LineageStep() {
  const { control, watch, setValue } = useFormContext<WizardValues>();
  const selectedLineage = watch('lineage');
  const gender = watch('gender');
  const icons = gender === 'FEMALE' ? LINEAGE_ICONS_F : LINEAGE_ICONS_M;
  const {
    data: lineages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['lineages', RULESET_KEY],
    queryFn: () => listLineages(RULESET_KEY),
  });

  if (isLoading) return <p>Loading lineages…</p>;
  if (isError) return <p className="text-destructive">Failed to load lineages.</p>;

  const currentLineage = lineages.find((l) => l.key === selectedLineage);
  const heritages = currentLineage?.heritages ?? [];

  return (
    <fieldset>
      <legend className="text-2xl font-heading mb-4">Lineage</legend>
      <Controller
        control={control}
        name="lineage"
        render={({ field, fieldState }) => (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lineages.map((l, i) => (
                <li key={l.key}>
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange(l.key);
                      // Reset heritage when lineage changes; default to first heritage of the new lineage.
                      const next = l.heritages.find((h) => h.isDefault) ?? l.heritages[0];
                      setValue('heritage', next?.key ?? '', { shouldValidate: true });
                    }}
                    className={
                      'w-full text-left p-4 border rounded-md transition-colors flex gap-4 items-start ' +
                      (field.value === l.key
                        ? 'border-primary bg-muted'
                        : 'border-border hover:bg-muted/30')
                    }
                  >
                    {icons[i] && (
                      <img
                        src={icons[i]}
                        alt=""
                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg">{l.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{l.description}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {fieldState.error && (
              <p role="alert" className="text-destructive text-sm mt-2">
                {fieldState.error.message}
              </p>
            )}
          </>
        )}
      />

      {heritages.length > 0 && (
        <Controller
          control={control}
          name="heritage"
          render={({ field, fieldState }) => (
            <div className="mt-6">
              <h4 className="font-heading text-lg mb-2">Heritage</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {heritages.map((h) => (
                  <li key={h.key}>
                    <button
                      type="button"
                      onClick={() => field.onChange(h.key)}
                      className={
                        'w-full text-left p-3 border rounded-md transition-colors ' +
                        (field.value === h.key
                          ? 'border-primary bg-muted'
                          : 'border-border hover:bg-muted/30')
                      }
                    >
                      <div className="font-heading">{h.displayName}</div>
                      <p className="text-sm text-muted-foreground">{h.description}</p>
                    </button>
                  </li>
                ))}
              </ul>
              {fieldState.error && (
                <p role="alert" className="text-destructive text-sm mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      )}
    </fieldset>
  );
}
