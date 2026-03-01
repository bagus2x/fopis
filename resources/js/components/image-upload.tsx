import { cn, formatBytes } from '@/lib/utils';
import { Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ImageUpload({
    value,
    onChange,
    onClear,
    error,
}: {
    value: File | null;
    onChange: (file: File) => void;
    onClear: () => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (!value) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(value);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [value]);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        onChange(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    if (preview && value) {
        return (
            <div className="overflow-hidden rounded-lg border">
                <div className="relative h-48 w-full">
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                    <div className="absolute right-12 bottom-2 left-3">
                        <p className="truncate text-[12px] font-medium text-white">
                            {value.name}
                        </p>
                        <p className="text-[11px] text-white/70">
                            {formatBytes(value.size)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                    <Upload className="h-3.5 w-3.5" /> Change image
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = '';
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
                dragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40',
                error && 'border-destructive/50',
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-center">
                <p className="text-sm font-medium">
                    {dragging ? 'Drop to upload' : 'Click or drag & drop'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                    PNG, JPG, WEBP up to 5 MB
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                }}
            />
        </div>
    );
}
