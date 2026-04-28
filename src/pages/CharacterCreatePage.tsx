import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Path } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/AppShell';
import { WizardProgress } from '@/components/WizardProgress';
import {
  RULESET_KEY,
  stepFieldGroups,
  wizardSchema,
  type WizardValues,
} from './wizard/schema';
import { IdentityStep } from './wizard/IdentityStep';
import { LineageStep } from './wizard/LineageStep';
import { ClassStep } from './wizard/ClassStep';
import { CultureStep } from './wizard/CultureStep';
import { StatsStep } from './wizard/StatsStep';
import { PortraitStep } from './wizard/PortraitStep';
import { ReviewStep } from './wizard/ReviewStep';
import { createCharacter, uploadPortrait } from '@/api/characters';
import { ApiError } from '@/api/errors';

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

// Map field name → step index where the user can fix it.
const FIELD_TO_STEP: Record<string, number> = {
  name: 0,
  gender: 0,
  pronouns: 0,
  bio: 0,
  lineage: 1,
  heritage: 1,
  charClass: 2,
  culture: 3,
  abilities: 4,
  portraitFile: 5,
};

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
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8,
      },
    },
  });
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [portraitWarning, setPortraitWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();

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

  const onSubmit = async () => {
    setSubmitError(null);
    setPortraitWarning(null);
    setSubmitting(true);
    const v = methods.getValues();
    try {
      const created = await createCharacter({
        name: v.name,
        ruleset: RULESET_KEY,
        lineage: v.lineage,
        heritage: v.heritage,
        charClass: v.charClass,
        culture: v.culture,
        gender: v.gender,
        abilities: v.abilities,
      });

      if (v.portraitFile) {
        try {
          await uploadPortrait(created.id, v.portraitFile);
        } catch {
          // Character is saved; portrait upload failed. Surface a warning, still navigate.
          setPortraitWarning(
            'Character saved, but portrait upload failed. You can retry it from the character list.',
          );
        }
      }

      qc.invalidateQueries({ queryKey: ['characters'] });
      nav('/');
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 400 &&
        Object.keys(e.fieldErrors).length > 0
      ) {
        // Map field errors back to form
        Object.entries(e.fieldErrors).forEach(([k, msg]) => {
          methods.setError(k as Path<WizardValues>, {
            type: 'server',
            message: msg,
          });
        });
        // Jump to earliest errored step
        const erroredFields = Object.keys(e.fieldErrors);
        const earliest = erroredFields
          .map((f) => FIELD_TO_STEP[f] ?? Number.POSITIVE_INFINITY)
          .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
        if (earliest !== Number.POSITIVE_INFINITY) setStep(earliest);
        setSubmitError('Please fix the highlighted fields.');
      } else {
        setSubmitError('Something went wrong; please try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === 6;

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
            {step === 4 && <StatsStep />}
            {step === 5 && <PortraitStep />}
            {step === 6 && <ReviewStep />}

            {(submitError || portraitWarning) && (
              <div className="mt-4 space-y-1">
                {submitError && (
                  <p role="alert" className="text-destructive">
                    {submitError}
                  </p>
                )}
                {portraitWarning && (
                  <p role="alert" className="text-primary">
                    {portraitWarning}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0 || submitting}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={isLastStep ? onSubmit : onNext}
                disabled={submitting}
              >
                {isLastStep
                  ? submitting
                    ? 'Submitting…'
                    : 'Create Character'
                  : 'Next'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
