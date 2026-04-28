import { Controller, useFormContext } from 'react-hook-form';
import { PortraitUpload } from '@/components/PortraitUpload';
import type { WizardValues } from './schema';

export function PortraitStep() {
  const { control } = useFormContext<WizardValues>();
  return (
    <fieldset>
      <legend className="text-2xl font-heading mb-4">Portrait</legend>
      <Controller
        control={control}
        name="portraitFile"
        render={({ field }) => (
          <PortraitUpload value={field.value} onChange={field.onChange} />
        )}
      />
    </fieldset>
  );
}
