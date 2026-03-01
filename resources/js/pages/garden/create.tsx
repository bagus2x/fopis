import AppLayout from '@/layouts/app-layout';
import garden from '@/routes/garden';
import type { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    Check,
    Crosshair,
    House,
    Image as ImageIcon,
    Loader2,
    Map as MapIcon,
    MapPin,
    Pencil,
    Plus,
    Save,
    Shapes,
    Trash2,
    Upload,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import GardenMapDrawer, {
    MapHandle,
} from '@/pages/garden/components/garden-map-drawer';
import { ImageUpload } from '@/components/image-upload';

interface User {
    id: number;
    name: string;
    email: string;
}

interface MemberEntry {
    user: User;
    role: 'MANAGER' | 'VIEWER';
}

interface GardenFormData {
    name: string;
    description: string;
    location: string;
    area_hectares: string;
    area: GeoJSON.Polygon | null;
    members: { user_id: number; role: string }[];
    image: File | null;
}

interface Props {
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Gardens', href: garden.index() },
    { title: 'New Garden', href: garden.create() },
];

CreateGarden.layout = (page: ReactNode) => (
    <AppLayout children={page} breadcrumbs={breadcrumbs} />
);

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

function SectionTitle({
    icon,
    title,
    subtitle,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted text-foreground">
                {icon}
            </div>
            <div>
                <p className="text-sm leading-tight font-semibold">{title}</p>
                {subtitle && (
                    <p className="text-[11px] text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function CreateGarden({ users = [] }: Props) {
    const mapRef = useRef<MapHandle>(null);
    const [mapReady, setMapReady] = useState(false);
    const [drawMode, setDrawMode] = useState(false);
    const [polygonReady, setPolygonReady] = useState(false);
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);
    const [members, setMembers] = useState<MemberEntry[]>([]);
    const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'form' | 'map'>('form');

    const { data, setData, processing, errors, transform, submit } =
        useForm<GardenFormData>({
            name: '',
            description: '',
            location: '',
            area_hectares: '',
            area: null,
            members: [],
            image: null,
        });

    const handlePolygonCreated = (polygon: GeoJSON.Polygon, areaHa: number) => {
        setPolygonReady(true);
        setDrawMode(false);
        setData('area', polygon);
        setData('area_hectares', String(areaHa));
    };

    const handlePolygonDeleted = () => {
        setPolygonReady(false);
        setData('area', null);
        setData('area_hectares', '');
    };

    const handleStartDraw = () => {
        mapRef.current?.deletePolygon();
        mapRef.current?.startDrawing();
        setDrawMode(true);
        setPolygonReady(false);
        setData('area', null);
        setData('area_hectares', '');
    };

    const handleClearPolygon = () => {
        mapRef.current?.deletePolygon();
        setPolygonReady(false);
        setDrawMode(false);
        setData('area', null);
        setData('area_hectares', '');
    };

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) return alert('Geolocation not supported.');
        navigator.permissions
            ?.query({ name: 'geolocation' })
            .then((r) => {
                setLocationDenied(r.state === 'denied');
                setLocationDialogOpen(true);
            })
            .catch(() => setLocationDialogOpen(true));
    }, []);

    const handleGrantLocation = useCallback(() => {
        setLocationDialogOpen(false);
        if (locationDenied) return;
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                mapRef.current?.flyTo([coords.longitude, coords.latitude], 16);
                mapRef.current?.addMarker([coords.longitude, coords.latitude]);

                if (!data.location) {
                    setData(
                        'location',
                        `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
                    );
                }
            },
            () => {
                setLocationDenied(true);
                setLocationDialogOpen(true);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, [locationDenied, data.location, setData]);

    const availableUsers = users.filter(
        (u) => !members.find((m) => m.user.id === u.id),
    );

    const addMember = (user: User) => {
        const updated = [...members, { user, role: 'MANAGER' as const }];
        setMembers(updated);
        setData(
            'members',
            updated.map((m) => ({ user_id: m.user.id, role: m.role })),
        );
        setMemberPopoverOpen(false);
    };

    const removeMember = (userId: number) => {
        const updated = members.filter((m) => m.user.id !== userId);
        setMembers(updated);
        setData(
            'members',
            updated.map((m) => ({ user_id: m.user.id, role: m.role })),
        );
    };

    const updateMemberRole = (userId: number, role: 'MANAGER' | 'VIEWER') => {
        const updated = members.map((m) =>
            m.user.id === userId ? { ...m, role } : m,
        );
        setMembers(updated);
        setData(
            'members',
            updated.map((m) => ({ user_id: m.user.id, role: m.role })),
        );
    };

    const handleSubmit = () => {
        transform((data) => {
            const fd = new FormData();
            fd.append('name', data.name);
            fd.append('description', data.description ?? '');
            fd.append('location', data.location ?? '');
            fd.append('area_hectares', data.area_hectares ?? '');

            if (data.area) fd.append('area', JSON.stringify(data.area));
            if (data.members?.length)
                fd.append('members', JSON.stringify(data.members));
            if (data.image) fd.append('image', data.image);

            return fd;
        });

        submit(garden.store());
    };

    console.log(errors);

    return (
        <>
            <Head title="New Garden" />

            <AlertDialog
                open={locationDialogOpen}
                onOpenChange={setLocationDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {locationDenied
                                ? 'Location Access Blocked'
                                : 'Allow Location Access'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {locationDenied
                                ? 'Your browser is blocking location access. Open browser settings, allow location for this site, then try again.'
                                : 'This app needs your GPS location to center the map and help you accurately mark your garden boundary.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {!locationDenied ? (
                            <AlertDialogAction onClick={handleGrantLocation}>
                                Allow
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction
                                onClick={() => setLocationDialogOpen(false)}
                            >
                                Got it
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
                    <div>
                        <h1 className="text-base font-semibold tracking-tight">
                            New Garden
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Fill in the details and draw the garden boundary
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="gap-1.5 px-4"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" /> Save Garden
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Tab Switcher */}
                <div className="flex shrink-0 border-b bg-background lg:hidden">
                    <button
                        onClick={() => setActiveTab('form')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                            activeTab === 'form'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <House className="h-4 w-4" />
                        Form
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                            activeTab === 'map'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <MapIcon className="h-4 w-4" />
                        Map
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Form Panel */}
                    <div
                        className={cn(
                            'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30 w-full overflow-y-auto border-r bg-background',
                            activeTab === 'form' ? 'block' : 'hidden lg:block',
                            'lg:w-[460px] xl:w-[520px]',
                        )}
                    >
                        <div className="space-y-8 px-4 py-5 sm:px-6">
                            {/* Garden Information Section */}
                            <section>
                                <SectionTitle
                                    icon={<House className="h-4 w-4" />}
                                    title="Garden Information"
                                    subtitle="Basic details about this garden plot"
                                />
                                <div className="space-y-6">
                                    {/* Garden Name - Required */}
                                    <Field
                                        orientation="vertical"
                                        className="gap-1.5"
                                    >
                                        <FieldLabel>
                                            Garden Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            placeholder="e.g. North Block — Mango Garden"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            aria-invalid={!!errors.name}
                                        />
                                        {errors.name && (
                                            <FieldError>
                                                {String(errors.name)}
                                            </FieldError>
                                        )}
                                    </Field>

                                    {/* Description */}
                                    <Field
                                        orientation="vertical"
                                        className="gap-1.5"
                                    >
                                        <FieldLabel>Description</FieldLabel>
                                        <FieldContent>
                                            <Textarea
                                                placeholder="Describe this garden…"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                                className="resize-none"
                                            />
                                            <FieldDescription>
                                                Optional — crop type, condition,
                                                notes.
                                            </FieldDescription>
                                        </FieldContent>
                                        {errors.description && (
                                            <FieldError>
                                                {String(errors.description)}
                                            </FieldError>
                                        )}
                                    </Field>

                                    {/* Location */}
                                    <Field
                                        orientation="vertical"
                                        className="gap-1.5"
                                    >
                                        <FieldLabel>
                                            Location / Address
                                        </FieldLabel>
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="e.g. Jl. Perkebunan No. 1, Bogor"
                                                value={data.location}
                                                onChange={(e) =>
                                                    setData(
                                                        'location',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-8"
                                            />
                                        </div>
                                        <FieldDescription>
                                            Auto-filled when you use GPS on the
                                            map.
                                        </FieldDescription>
                                        {errors.location && (
                                            <FieldError>
                                                {String(errors.location)}
                                            </FieldError>
                                        )}
                                    </Field>

                                    {/* Area */}
                                    <Field
                                        orientation="vertical"
                                        className="gap-1.5"
                                    >
                                        <FieldLabel>Area (Hectares)</FieldLabel>
                                        <div className="relative">
                                            <Shapes className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                placeholder="0.0000"
                                                value={data.area_hectares}
                                                onChange={(e) =>
                                                    setData(
                                                        'area_hectares',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-8"
                                            />
                                        </div>
                                        <FieldDescription>
                                            Automatically calculated from drawn
                                            polygon.
                                        </FieldDescription>
                                        {errors.area_hectares && (
                                            <FieldError>
                                                {String(errors.area_hectares)}
                                            </FieldError>
                                        )}
                                    </Field>

                                    {polygonReady && (
                                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/70 px-3 py-2.5 dark:border-green-800 dark:bg-green-950/60">
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                                                <Check
                                                    className="h-2.5 w-2.5"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                            <span className="text-sm text-green-800 dark:text-green-300">
                                                Polygon saved —{' '}
                                                <strong>
                                                    {data.area_hectares} ha
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <Separator />

                            {/* Garden Photo Section */}
                            <section>
                                <SectionTitle
                                    icon={<ImageIcon className="h-4 w-4" />}
                                    title="Garden Photo"
                                    subtitle="Optional cover image for this garden"
                                />
                                <Field
                                    orientation="vertical"
                                    className="gap-1.5"
                                >
                                    <ImageUpload
                                        value={data.image}
                                        onChange={(file) =>
                                            setData('image', file)
                                        }
                                        onClear={() => setData('image', null)}
                                        error={errors.image}
                                    />
                                    {errors.image && (
                                        <FieldError>
                                            {String(errors.image)}
                                        </FieldError>
                                    )}
                                </Field>
                            </section>

                            <Separator />

                            {/* Team Members Section */}
                            <section>
                                <SectionTitle
                                    icon={<Users className="h-4 w-4" />}
                                    title="Team Members"
                                    subtitle="Add managers or viewers for this garden"
                                />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                                        <Avatar className="h-7 w-7">
                                            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                                                <UserRound className="h-3.5 w-3.5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">
                                                You
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Owner of this garden
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 text-[11px] font-medium"
                                        >
                                            Owner
                                        </Badge>
                                    </div>

                                    {members.map((m) => (
                                        <div
                                            key={m.user.id}
                                            className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/30"
                                        >
                                            <Avatar className="h-7 w-7">
                                                <AvatarFallback className="bg-accent text-[10px] font-semibold">
                                                    {initials(m.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {m.user.name}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {m.user.email}
                                                </p>
                                            </div>
                                            <Select
                                                value={m.role}
                                                onValueChange={(v) =>
                                                    updateMemberRole(
                                                        m.user.id,
                                                        v as
                                                            | 'MANAGER'
                                                            | 'VIEWER',
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-7 w-[96px] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value="MANAGER"
                                                        className="text-xs"
                                                    >
                                                        Manager
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="VIEWER"
                                                        className="text-xs"
                                                    >
                                                        Viewer
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() =>
                                                    removeMember(m.user.id)
                                                }
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}

                                    {availableUsers.length > 0 && (
                                        <Popover
                                            open={memberPopoverOpen}
                                            onOpenChange={setMemberPopoverOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-1 w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />{' '}
                                                    Add Member
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-[280px] p-0"
                                                align="start"
                                            >
                                                <Command>
                                                    <CommandInput placeholder="Search by name or email…" />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No users found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {availableUsers.map(
                                                                (u) => (
                                                                    <CommandItem
                                                                        key={
                                                                            u.id
                                                                        }
                                                                        onSelect={() =>
                                                                            addMember(
                                                                                u,
                                                                            )
                                                                        }
                                                                        className="cursor-pointer gap-2.5 py-2"
                                                                    >
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarFallback className="text-[10px] font-semibold">
                                                                                {initials(
                                                                                    u.name,
                                                                                )}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-sm font-medium">
                                                                                {
                                                                                    u.name
                                                                                }
                                                                            </p>
                                                                            <p className="truncate text-[11px] text-muted-foreground">
                                                                                {
                                                                                    u.email
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </section>

                            {/* Mobile Submit Button */}
                            <div className="flex gap-2 pt-2 pb-4 lg:hidden">
                                <Button
                                    className="flex-1 gap-1.5"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-3.5 w-3.5" />{' '}
                                            Save Garden
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Map Panel */}
                    <div
                        className={cn(
                            'relative flex-1 bg-muted/20',
                            activeTab === 'map' ? 'block' : 'hidden lg:block',
                        )}
                    >
                        <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/90 px-3 py-2 backdrop-blur-md sm:px-4">
                            <p className="mr-auto hidden text-xs font-medium tracking-wider text-muted-foreground uppercase sm:block">
                                Garden Boundary Map
                            </p>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={requestLocation}
                                className="h-7 gap-1.5 text-xs"
                            >
                                <Crosshair className="h-3.5 w-3.5" /> My
                                Location
                            </Button>

                            {!drawMode && !polygonReady && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleStartDraw}
                                    disabled={!mapReady}
                                    className="h-7 gap-1.5 text-xs"
                                >
                                    <Pencil className="h-3.5 w-3.5" /> Draw Area
                                </Button>
                            )}
                            {drawMode && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleClearPolygon}
                                    className="h-7 gap-1.5 border-destructive/50 text-xs text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-3.5 w-3.5" /> Cancel
                                </Button>
                            )}
                            {polygonReady && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleStartDraw}
                                        className="h-7 gap-1.5 text-xs"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />{' '}
                                        Redraw
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleClearPolygon}
                                        className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Clear
                                    </Button>
                                </>
                            )}
                        </div>

                        {drawMode && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 sm:bottom-8">
                                <div className="rounded-full border bg-background/95 px-4 py-2 text-center text-xs font-medium shadow-md backdrop-blur sm:text-sm">
                                    Click to place points · Double-click or
                                    click the first point to finish
                                </div>
                            </div>
                        )}

                        <GardenMapDrawer
                            ref={mapRef}
                            onMapReady={() => setMapReady(true)}
                            onPolygonCreated={handlePolygonCreated}
                            onPolygonDeleted={handlePolygonDeleted}
                            initialPolygon={data.area}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
