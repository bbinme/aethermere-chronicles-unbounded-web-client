import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';

export function AppShell({ children }: { children: ReactNode }) {
  const { accessToken, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-heading text-primary">
          Aethermere
        </Link>
        {accessToken && (
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              nav('/login');
            }}
          >
            Log out
          </Button>
        )}
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
