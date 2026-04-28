import { z } from 'zod';

export const wizardSchema = z.object({
  // Identity
  name: z.string().min(1, 'Required').max(40, 'Max 40 chars'),
  pronouns: z.string().max(40, 'Max 40 chars').optional(),
  bio: z.string().max(500, 'Max 500 chars').optional(),
  // Lineage / Class / Culture (keys from GMS)
  lineage: z.string().min(1, 'Required'),
  heritage: z.string().min(1, 'Required'),
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
  // Other character fields
  gender: z.string().min(1, 'Required'),
  // Portrait — added in Task 13
  portraitFile: z.instanceof(Blob).optional(),
});

export type WizardValues = z.infer<typeof wizardSchema>;

export const RULESET_KEY = 'DND';

export const stepFieldGroups = {
  identity: ['name', 'pronouns', 'bio', 'gender'] as const,
  lineage: ['lineage', 'heritage'] as const,
  classStep: ['charClass'] as const,
  culture: ['culture'] as const,
  stats: ['abilities'] as const,
  portrait: ['portraitFile'] as const,
} as const;
