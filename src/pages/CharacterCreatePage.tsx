import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/AppShell';
import { WizardProgress } from '@/components/WizardProgress';
import { stepFieldGroups, wizardSchema, type WizardValues } from './wizard/schema';
import { IdentityStep } from './wizard/IdentityStep';
import { LineageStep } from './wizard/LineageStep';
import { ClassStep } from './wizard/ClassStep';
import { CultureStep } from './wizard/CultureStep';

const STEP_FIELDS = [
  stepFieldGroups.identity,
  stepFieldGroups.lineage,
  stepFieldGroups.classStep,
  stepFieldGroups.culture,
  stepFieldGroups.stats,
  stepFieldGroups.portrait,
  // Step 6 (index) is Review — no fields to validate before submitting.
  [] as const,
] as const;

export function CharacterCreatePage() {
  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      gender: '',
      pronouns: '',
      bio: '',
      lineage: '',
      heritage: '',
      charClass: '',
      culture: '',
      abilities: {
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
      },
    },
  });
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);

  const onNext = async () => {
    const fields = STEP_FIELDS[step] as readonly (keyof WizardValues)[];
    const ok = fields.length === 0 ? true : await methods.trigger(fields);
    if (!ok) return;
    setStep((s) => {
      const next = Math.min(s + 1, 6);
      setFurthest((f) => Math.max(f, next));
      return next;
    });
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl mb-4">Create Character</h1>
        <WizardProgress current={step} furthest={furthest} onJump={setStep} />
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            {step === 0 && <IdentityStep />}
            {step === 1 && <LineageStep />}
            {step === 2 && <ClassStep />}
            {step === 3 && <CultureStep />}
            {step === 4 && (
              <p className="text-muted-foreground">Stats step — coming in Task 13.</p>
            )}
            {step === 5 && (
              <p className="text-muted-foreground">Portrait step — coming in Task 13.</p>
            )}
            {step === 6 && (
              <p className="text-muted-foreground">Review + submit — coming in Task 14.</p>
            )}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              <Button type="button" onClick={onNext} disabled={step === 6}>
                {step === 6 ? 'Create Character' : 'Next'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
