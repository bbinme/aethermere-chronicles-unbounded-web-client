import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortraitBlob } from '@/api/characters';
import { useAuth } from '@/auth/useAuth';

interface Props {
  characterId: string;
  alt: string;
  className?: string;
}

export function CharacterPortrait({ characterId, alt, className }: Props) {
  const { accessToken } = useAuth();
  const { data } = useQuery({
    queryKey: ['portrait', characterId, accessToken],
    queryFn: () => fetchPortraitBlob(characterId, accessToken),
    staleTime: 5 * 60 * 1000,
    enabled: !!accessToken,
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [data]);

  const sizeClass = className ?? 'w-32 h-32 rounded-md';

  if (!url) {
    return (
      <div
        className={`${sizeClass} bg-muted flex items-center justify-center text-muted-foreground`}
        aria-label={`${alt} (no portrait)`}
      >
        ?
      </div>
    );
  }
  return <img src={url} alt={alt} className={`${sizeClass} object-cover`} />;
}
