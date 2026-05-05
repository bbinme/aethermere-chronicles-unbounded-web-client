import { z } from 'zod';
import { ABILITY_KEYS } from './pointBuy';

const ABILITY_OR_EMPTY = z.string().refine(
  (s) => s !== '' && (ABILITY_KEYS as readonly string[]).includes(s),
  { message: 'Required' },
);

export const wizardSchema = z
  .object({
    // Identity
    name: z.string().min(1, 'Required').max(40, 'Max 40 chars'),
    pronouns: z.string().max(40, 'Max 40 chars').optional(),
    bio: z.string().max(500, 'Max 500 chars').optional(),
    // Lineage / Class / Culture (keys from GMS)
    lineage: z.string().min(1, 'Required'),
    // Heritage is conditionally required: only when the chosen lineage exposes one
    // or more heritages. The schema can't see the loaded lineage list, so the
    // conditional rule is enforced in LineageStep via setError/clearErrors.
    heritage: z.string(),
    charClass: z.string().min(1, 'Required'),
    culture: z.string().min(1, 'Required'),
    // Stats — DND 27-point buy (each ability 8..16). Schema allows under-spent
    // submissions; the StatsStep UI prevents over-spending.
    abilities: z.object({
      strength: z.number().int().min(8, 'Min 8').max(16, 'Max 16'),
      dexterity: z.number().int().min(8, 'Min 8').max(16, 'Max 16'),
      constitution: z.number().int().min(8, 'Min 8').max(16, 'Max 16'),
      intelligence: z.number().int().min(8, 'Min 8').max(16, 'Max 16'),
      wisdom: z.number().int().min(8, 'Min 8').max(16, 'Max 16'),
      charisma: z.number().int().min(8, 'Min 8').max(16, 'Max 16'),
    }),
    // Lineage bonuses — user picks one ability for +2 and one for +1.
    bonusPlus2: ABILITY_OR_EMPTY,
    bonusPlus1: ABILITY_OR_EMPTY,
    // Other character fields
    gender: z.string().min(1, 'Required'),
    // Portrait
    portraitFile: z.instanceof(Blob).optional(),
  })
  .refine((v) => v.bonusPlus2 !== v.bonusPlus1, {
    path: ['bonusPlus1'],
    message: 'Must be different abilities',
  });

export type WizardValues = z.infer<typeof wizardSchema>;

export const RULESET_KEY = 'DND';

export const stepFieldGroups = {
  identity: ['name', 'pronouns', 'bio', 'gender'] as const,
  lineage: ['lineage', 'heritage'] as const,
  classStep: ['charClass'] as const,
  culture: ['culture'] as const,
  stats: ['abilities', 'bonusPlus2', 'bonusPlus1'] as const,
  portrait: ['portraitFile'] as const,
} as const;
