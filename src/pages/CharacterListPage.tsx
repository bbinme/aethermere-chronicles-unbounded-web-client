import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listCharacters } from '@/api/characters';
import { useAuth } from '@/auth/useAuth';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { AppShell } from '@/components/AppShell';

export function CharacterListPage() {
  const { playerId } = useAuth();
  const { data: characters = [], isLoading, isError } = useQuery({
    queryKey: ['characters', playerId],
    queryFn: () => (playerId ? listCharacters(playerId) : Promise.resolve([])),
    enabled: !!playerId,
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl">Your Characters</h1>
          <Button asChild>
            <Link to="/characters/new">Create New Character</Link>
          </Button>
        </div>

        {isLoading && <p>Loading…</p>}
        {isError && <p className="text-destructive">Failed to load characters.</p>}

        {!isLoading && !isError && characters.length === 0 && (
          <p className="text-muted-foreground">You haven&apos;t created any characters yet.</p>
        )}

        {!isLoading && characters.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {characters.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/characters/${encodeURIComponent(c.id)}`}
                  className="border border-border rounded-md p-4 flex gap-4 items-center transition-colors hover:bg-muted/30 hover:border-primary"
                >
                  <CharacterPortrait characterId={c.id} alt={c.name} />
                  <div>
                    <h2 className="font-heading text-xl">{c.name}</h2>
                    <p className="text-muted-foreground text-sm">
                      {[c.lineage?.name, c.characterClass].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-muted-foreground text-xs">Level {c.level}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
