import { useQuery } from '@tanstack/react-query';
import { Controller, useFormContext } from 'react-hook-form';
import { listClasses } from '@/api/rulesets';
import { RULESET_KEY, type WizardValues } from './schema';

export function ClassStep() {
  const { control } = useFormContext<WizardValues>();
  const {
    data: classes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['classes', RULESET_KEY],
    queryFn: () => listClasses(RULESET_KEY),
  });

  if (isLoading) return <p>Loading classes…</p>;
  if (isError) return <p className="text-destructive">Failed to load classes.</p>;

  return (
    <fieldset>
      <legend className="text-2xl font-heading mb-4">Class</legend>
      <Controller
        control={control}
        name="charClass"
        render={({ field, fieldState }) => (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classes.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => field.onChange(c.key)}
                    className={
                      'w-full text-left p-4 border rounded-md transition-colors ' +
                      (field.value === c.key
                        ? 'border-primary bg-muted'
                        : 'border-border hover:bg-muted/30')
                    }
                  >
                    <h3 className="font-heading text-lg">{c.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
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
    </fieldset>
  );
}
