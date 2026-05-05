import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppShell } from '@/components/AppShell';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { PortraitUpload } from '@/components/PortraitUpload';
import {
  getCharacter,
  renameCharacter,
  uploadPortrait,
} from '@/api/characters';
import { listClasses } from '@/api/rulesets';
import { ApiError } from '@/api/errors';
import { firstLevelHp } from '@/pages/wizard/pointBuy';
import type { CharacterResponse, ClassResponse } from '@/api/types';

const ABILITY_LABELS: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const characterId = id ?? '';

  const {
    data: character,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
    enabled: !!characterId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', character?.ruleset],
    queryFn: () => listClasses(character!.ruleset),
    enabled: !!character?.ruleset,
  });

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [portraitMessage, setPortraitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (character) setNameDraft(character.name);
  }, [character]);

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameCharacter(characterId, name),
    onSuccess: (updated) => {
      qc.setQueryData(['character', characterId], updated);
      qc.invalidateQueries({ queryKey: ['characters'] });
      setEditingName(false);
      setNameError(null);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors.name) {
        setNameError(e.fieldErrors.name);
      } else if (e instanceof ApiError && e.status === 404) {
        setNameError('Rename not yet supported by the server.');
      } else {
        setNameError('Could not save name.');
      }
    },
  });

  const portraitMutation = useMutation({
    mutationFn: (blob: Blob) => uploadPortrait(characterId, blob),
    onSuccess: () => {
      // Force CharacterPortrait to refetch the new image.
      qc.invalidateQueries({ queryKey: ['portrait', characterId] });
      setPortraitMessage('Portrait updated.');
    },
    onError: () => {
      setPortraitMessage('Portrait upload failed.');
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <p>Loading…</p>
      </AppShell>
    );
  }
  if (isError || !character) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-destructive">Could not load character.</p>
          <Button asChild variant="ghost">
            <Link to="/">Back to characters</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button asChild variant="ghost">
            <Link to="/">← Back to characters</Link>
          </Button>
          <Button asChild>
            <Link to={`/characters/${encodeURIComponent(character.id)}/worlds`}>
              Play
            </Link>
          </Button>
        </div>

        <header className="flex gap-6 items-start">
          <CharacterPortrait
            characterId={character.id}
            alt={character.name}
            className="w-40 h-40 rounded-md"
          />
          <div className="flex-1 space-y-2">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = nameDraft.trim();
                  if (trimmed.length === 0) {
                    setNameError('Required');
                    return;
                  }
                  if (trimmed.length > 40) {
                    setNameError('Max 40 chars');
                    return;
                  }
                  renameMutation.mutate(trimmed);
                }}
                className="space-y-2"
              >
                <Label htmlFor="character-name">Name</Label>
                <Input
                  id="character-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
                {nameError && (
                  <p role="alert" className="text-destructive text-sm">{nameError}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={renameMutation.isPending}>
                    {renameMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(character.name);
                      setNameError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading">{character.name}</h1>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingName(true)}
                  aria-label="Edit name"
                >
                  Edit
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">
              {[`Level ${character.level}`, character.lineage?.name, character.characterClass]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
        </header>

        <section className="border-t border-border pt-6 space-y-3">
          <h2 className="text-xl font-heading">Portrait</h2>
          <PortraitUpload
            value={undefined}
            onChange={(blob) => {
              if (blob) portraitMutation.mutate(blob);
            }}
          />
          {portraitMessage && (
            <p
              role="status"
              className={
                portraitMutation.isError
                  ? 'text-destructive text-sm'
                  : 'text-primary text-sm'
              }
            >
              {portraitMessage}
            </p>
          )}
        </section>

        <section className="border-t border-border pt-6 space-y-2">
          <h2 className="text-xl font-heading">Details</h2>
          <Row label="Ruleset" value={character.ruleset} />
          <Row label="Lineage" value={character.lineage?.name ?? '—'} />
          <Row label="Heritage" value={character.heritage?.name ?? '—'} />
          <Row label="Class" value={character.characterClass} />
          <Row label="Culture" value={character.culture?.name ?? '—'} />
          <Row label="Level" value={String(character.level)} />
          <Row label="HP" value={resolveHpDisplay(character, classes)} />
        </section>

        {character.abilityScores && (
          <section className="border-t border-border pt-6 space-y-3">
            <h2 className="text-xl font-heading">Abilities</h2>
            <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(character.abilityScores).map(([key, value]) => (
                <li key={key} className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {ABILITY_LABELS[key] ?? key}
                  </div>
                  <div className="font-heading text-lg">{value.score}</div>
                  <div className="text-sm text-muted-foreground">
                    {value.modifier}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Button variant="ghost" onClick={() => nav('/')}>← Back to characters</Button>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-32">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function resolveHpDisplay(
  character: CharacterResponse,
  classes: ClassResponse[],
): string {
  // Server-provided HP wins once GMS computes it.
  const serverMax = character.hitPoints?.max ?? 0;
  if (serverMax > 0) return String(serverMax);
  // Client-side fallback only at 1st level.
  if (character.level !== 1) return '—';
  const cls = classes.find((c) => c.key === character.characterClass);
  const conMod = parseInt(
    character.abilityScores?.constitution?.modifier ?? '0',
    10,
  );
  const hp = firstLevelHp(cls?.hitDie, Number.isFinite(conMod) ? conMod : 0);
  return hp == null ? '—' : String(hp);
}
