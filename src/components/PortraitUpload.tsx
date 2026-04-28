import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { downscaleToWebP } from '@/lib/imageResize';

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;

interface Props {
  value: Blob | undefined;
  onChange: (b: Blob | undefined) => void;
}

export function PortraitUpload({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Recompute preview URL when value changes (or clears on unmount).
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(value);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError('Must be PNG, JPEG, or WebP');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Max 4 MB');
      return;
    }
    try {
      const blob = await downscaleToWebP(file);
      onChange(blob);
    } catch {
      setError('Could not process image');
    }
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="portrait-input"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) await handleFile(f);
        }}
        className="block border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer"
      >
        <input
          id="portrait-input"
          type="file"
          className="sr-only"
          accept={ACCEPT.join(',')}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        Drop an image or click to choose
      </label>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-48 h-48 object-cover rounded-md"
        />
      )}
      <div className="flex gap-2">
        <Button type="button" disabled title="Coming soon">
          Generate with AI (coming soon)
        </Button>
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange(undefined)}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
