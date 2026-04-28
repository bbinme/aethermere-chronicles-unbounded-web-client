import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WizardValues } from './schema';

export function IdentityStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <fieldset className="space-y-4">
      <legend className="text-2xl font-heading mb-4">Identity</legend>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="off" {...register('name')} />
        {errors.name && (
          <p role="alert" className="text-destructive text-sm">
            {errors.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          {...register('gender')}
          className="w-full border border-input rounded-md p-2 bg-background"
        >
          <option value="">Select…</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="NON_BINARY">Non-binary</option>
        </select>
        {errors.gender && (
          <p role="alert" className="text-destructive text-sm">
            {errors.gender.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="pronouns">Pronouns (optional)</Label>
        <Input id="pronouns" autoComplete="off" {...register('pronouns')} />
        {errors.pronouns && (
          <p role="alert" className="text-destructive text-sm">
            {errors.pronouns.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="bio">Bio (optional)</Label>
        <textarea
          id="bio"
          {...register('bio')}
          className="w-full border border-input rounded-md p-2 min-h-24 bg-background"
        />
        {errors.bio && (
          <p role="alert" className="text-destructive text-sm">
            {errors.bio.message}
          </p>
        )}
      </div>
    </fieldset>
  );
}
