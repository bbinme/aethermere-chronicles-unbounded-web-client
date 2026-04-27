import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { refresh } from '@/api/auth';

export function ProtectedRoute() {
  const { accessToken, setAccessToken } = useAuth();
  const [status, setStatus] = useState<'checking' | 'authed' | 'guest'>(
    accessToken ? 'authed' : 'checking',
  );

  useEffect(() => {
    if (accessToken) {
      setStatus('authed');
      return;
    }
    let cancelled = false;
    refresh()
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.accessToken);
        setStatus('authed');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, setAccessToken]);

  if (status === 'checking') return <div className="p-8">Loading…</div>;
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <Outlet />;
}
