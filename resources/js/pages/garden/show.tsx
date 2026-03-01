import AppLayout from '@/layouts/app-layout';
import garden from '@/routes/garden';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImageUpload } from '@/components/image-upload';
import { cn } from '@/lib/utils';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Crosshair,
    Image as ImageIcon,
    Info,
    LayoutList,
    Leaf,
    Loader2,
    Map as MapIcon,
    MapPin,
    Pencil,
    Plus,
    Search,
    Sprout,
} from 'lucide-react';
import {
    ReactNode,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { svgMarker } from '@/pages/garden/lib/utils';

interface GardenMember {
    id: number;
    role: string;
    user: { id: number; name: string; email: string };
}

interface Plant {
    id: number;
    plant_code: string;
    variety: string | null;
    block: string | null;
    sub_block: string | null;
    latitude: string | null;
    longitude: string | null;
    planting_year: number | null;
    propagation_method: string | null;
    rootstock: string | null;
    seed_origin: string | null;
    description: string | null;
    status: string | null;
    status_change_date: string | null;
    status_change_reason: string | null;
    parent_tree_type: string | null;
    parent_tree_class: string | null;
    registration_number: string | null;
    parent_tree_notes: string | null;
    image_url?: string | null;
}

interface PlantCoord {
    id: number;
    plant_code: string;
    variety: string | null;
    block: string | null;
    status: string | null;
    latitude: string;
    longitude: string;
}

interface Paginator {
    data: Plant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface GardenDetail {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    area_hectares: string | null;
    image_url: string | null;
    area: GeoJSON.Polygon | null;
    created_at: string;
    members: GardenMember[];
}

interface Props {
    garden: GardenDetail;
    plants: Paginator;
    filters: { search?: string; per_page?: number };
}

interface ClusteredMapHandle {
    refreshPlants: () => Promise<void>;
    flyTo: (coords: [number, number], zoom?: number) => void;
    addMarker: (coords: [number, number]) => void;
}

function makeBreadcrumbs(g: GardenDetail): BreadcrumbItem[] {
    return [
        { title: 'Gardens', href: garden.index() },
        { title: g.name, href: garden.show(g.id) },
    ];
}

ShowGarden.layout = (page: ReactNode) => (
    <AppLayout
        children={page}
        breadcrumbs={makeBreadcrumbs((page as any).props.garden)}
    />
);

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getRoleBadge(role: string) {
    if (role === 'OWNER')
        return {
            label: 'Owner',
            cls: 'bg-primary/10 text-primary border-primary/20',
        };
    if (role === 'MANAGER')
        return {
            label: 'Manager',
            cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        };
    return {
        label: 'Viewer',
        cls: 'bg-muted text-muted-foreground border-border',
    };
}

function getStatusCls(status: string | null): string {
    if (!status) return 'bg-muted text-muted-foreground border-border';
    const map: Record<string, string> = {
        active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
        inactive: 'bg-muted text-muted-foreground border-border',
        removed:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
        dead: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
    };
    return (
        map[status.toLowerCase()] ??
        'bg-muted text-muted-foreground border-border'
    );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-sm">{value}</span>
        </div>
    );
}

function GardenInfoPanel({ g }: { g: GardenDetail }) {
    const myRole = g.members[0];
    return (
        <div className="flex h-full flex-col overflow-y-auto">
            {g.image_url ? (
                <div className="relative h-32 w-full shrink-0 overflow-hidden bg-muted/50">
                    <img
                        src={g.image_url}
                        alt={g.name}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
                </div>
            ) : (
                <div className="flex h-20 w-full shrink-0 items-center justify-center border-b bg-muted/20">
                    <ImageIcon
                        className="h-7 w-7 text-muted-foreground/20"
                        strokeWidth={1.25}
                    />
                </div>
            )}
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h2 className="text-sm leading-tight font-semibold">
                            {g.name}
                        </h2>
                        {g.location && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{g.location}</span>
                            </p>
                        )}
                    </div>
                    {myRole && (
                        <Badge
                            variant="outline"
                            className={cn(
                                'shrink-0 text-[10px]',
                                getRoleBadge(myRole.role).cls,
                            )}
                        >
                            {getRoleBadge(myRole.role).label}
                        </Badge>
                    )}
                </div>
                {g.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        {g.description}
                    </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                            Area
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {g.area_hectares
                                ? `${parseFloat(g.area_hectares).toFixed(2)} ha`
                                : '—'}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                            Members
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {g.members.length}
                        </p>
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Team
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {g.members.map((m) => {
                            const badge = getRoleBadge(m.role);
                            return (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-2"
                                >
                                    <Avatar className="h-6 w-6 shrink-0">
                                        <AvatarFallback className="text-[9px] font-semibold">
                                            {initials(m.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs leading-tight font-medium">
                                            {m.user.name}
                                        </p>
                                        <p className="truncate text-[10px] text-muted-foreground">
                                            {m.user.email}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'shrink-0 text-[9px]',
                                            badge.cls,
                                        )}
                                    >
                                        {badge.label}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    Created {formatDate(g.created_at)}
                </div>
                {(myRole?.role === 'OWNER' || myRole?.role === 'MANAGER') && (
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                    >
                        <Link href={garden.edit(g.id)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit Garden
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function PlantDetailDrawer({
    plant,
    open,
    onClose,
}: {
    plant: Plant | null;
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-lg">
                    {!plant ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <DrawerHeader className="pb-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <DrawerTitle>
                                            {plant.plant_code}
                                        </DrawerTitle>
                                        {plant.variety && (
                                            <DrawerDescription className="mt-0.5">
                                                {plant.variety}
                                            </DrawerDescription>
                                        )}
                                    </div>
                                    {plant.status && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'shrink-0 text-[11px]',
                                                getStatusCls(plant.status),
                                            )}
                                        >
                                            {plant.status}
                                        </Badge>
                                    )}
                                </div>
                            </DrawerHeader>
                            <div className="max-h-[60vh] overflow-y-auto px-4 pb-2">
                                <div className="grid gap-4">
                                    {(plant.block || plant.sub_block) && (
                                        <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                                            <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                Location in Garden
                                            </p>
                                            <div className="flex gap-6">
                                                {plant.block && (
                                                    <InfoRow
                                                        label="Block"
                                                        value={plant.block}
                                                    />
                                                )}
                                                {plant.sub_block && (
                                                    <InfoRow
                                                        label="Sub-block"
                                                        value={plant.sub_block}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        <InfoRow
                                            label="Planting Year"
                                            value={plant.planting_year}
                                        />
                                        <InfoRow
                                            label="Propagation"
                                            value={plant.propagation_method}
                                        />
                                        <InfoRow
                                            label="Rootstock"
                                            value={plant.rootstock}
                                        />
                                        <InfoRow
                                            label="Seed Origin"
                                            value={plant.seed_origin}
                                        />
                                        <InfoRow
                                            label="Registration No."
                                            value={plant.registration_number}
                                        />
                                    </div>
                                    {plant.description && (
                                        <div>
                                            <p className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                Description
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {plant.description}
                                            </p>
                                        </div>
                                    )}
                                    {(plant.parent_tree_type ||
                                        plant.parent_tree_class) && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                    Parent Tree
                                                </p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InfoRow
                                                        label="Type"
                                                        value={
                                                            plant.parent_tree_type
                                                        }
                                                    />
                                                    <InfoRow
                                                        label="Class"
                                                        value={
                                                            plant.parent_tree_class
                                                        }
                                                    />
                                                </div>
                                                {plant.parent_tree_notes && (
                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                        {
                                                            plant.parent_tree_notes
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {plant.status_change_date && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                    Status Change
                                                </p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InfoRow
                                                        label="Date"
                                                        value={formatDate(
                                                            plant.status_change_date,
                                                        )}
                                                    />
                                                    <InfoRow
                                                        label="Reason"
                                                        value={
                                                            plant.status_change_reason
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {plant.latitude && plant.longitude && (
                                        <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                                            <p className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                Coordinates
                                            </p>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {parseFloat(
                                                    plant.latitude,
                                                ).toFixed(6)}
                                                ,{' '}
                                                {parseFloat(
                                                    plant.longitude,
                                                ).toFixed(6)}
                                            </p>
                                        </div>
                                    )}
                                    {plant.image_url && (
                                        <div>
                                            <p className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                Photo
                                            </p>
                                            <img
                                                src={plant.image_url}
                                                alt={plant.plant_code}
                                                className="max-h-48 w-full rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DrawerFooter className="pt-2">
                                <DrawerClose asChild>
                                    <Button variant="outline" size="sm">
                                        Close
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

interface AddPlantForm {
    plant_code: string;
    variety: string;
    block: string;
    sub_block: string;
    latitude: string;
    longitude: string;
    planting_year: string;
    propagation_method: string;
    description: string;
    status: string;
    image: File | null;
}

function AddPlantDrawer({
    open,
    onClose,
    gardenId,
    initialCoords,
    onPlantAdded,
}: {
    open: boolean;
    onClose: () => void;
    gardenId: number;
    initialCoords: [number, number] | null;
    onPlantAdded?: () => void;
}) {
    const { data, setData, processing, errors, reset, transform, submit } =
        useForm<AddPlantForm>({
            plant_code: '',
            variety: '',
            block: '',
            sub_block: '',
            latitude: '',
            longitude: '',
            planting_year: '',
            propagation_method: '',
            description: '',
            status: '',
            image: null,
        });

    useEffect(() => {
        if (initialCoords) {
            setData('latitude', initialCoords[1].toFixed(6));
            setData('longitude', initialCoords[0].toFixed(6));
        } else {
            setData('latitude', '');
            setData('longitude', '');
        }
    }, [initialCoords]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = () => {
        transform((d) => {
            const fd = new FormData();
            fd.append('plant_code', d.plant_code);
            if (d.variety) fd.append('variety', d.variety);
            if (d.block) fd.append('block', d.block);
            if (d.sub_block) fd.append('sub_block', d.sub_block);
            if (d.latitude) fd.append('latitude', d.latitude);
            if (d.longitude) fd.append('longitude', d.longitude);
            if (d.planting_year) fd.append('planting_year', d.planting_year);
            if (d.propagation_method)
                fd.append('propagation_method', d.propagation_method);
            if (d.description) fd.append('description', d.description);
            if (d.status) fd.append('status', d.status);
            if (d.image) fd.append('image', d.image);
            return fd;
        });
        submit('post', `/gardens/${gardenId}/plants`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
                onPlantAdded?.();
            },
        });
    };

    return (
        <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-lg">
                    <DrawerHeader className="px-6 pt-6">
                        <DrawerTitle className="flex items-center gap-2">
                            <Sprout className="h-4 w-4 text-primary" />
                            Add Plant
                        </DrawerTitle>
                        <DrawerDescription>
                            Add a new plant to this garden.
                            {initialCoords && ' Location pre-filled from map.'}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="max-h-[65vh] overflow-y-auto px-6 pb-2">
                        <div className="grid gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="plant_code" className="text-xs">
                                    Plant Code{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="plant_code"
                                    placeholder="e.g. PLT-001"
                                    value={data.plant_code}
                                    onChange={(e) =>
                                        setData('plant_code', e.target.value)
                                    }
                                    className={cn(
                                        'h-8 text-sm',
                                        errors.plant_code &&
                                            'border-destructive',
                                    )}
                                />
                                {errors.plant_code && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.plant_code}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="variety"
                                        className="text-xs"
                                    >
                                        Variety
                                    </Label>
                                    <Input
                                        id="variety"
                                        placeholder="e.g. Robusta"
                                        value={data.variety}
                                        onChange={(e) =>
                                            setData('variety', e.target.value)
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="block" className="text-xs">
                                        Block
                                    </Label>
                                    <Input
                                        id="block"
                                        placeholder="e.g. A1"
                                        value={data.block}
                                        onChange={(e) =>
                                            setData('block', e.target.value)
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="sub_block"
                                        className="text-xs"
                                    >
                                        Sub-block
                                    </Label>
                                    <Input
                                        id="sub_block"
                                        placeholder="e.g. A1-2"
                                        value={data.sub_block}
                                        onChange={(e) =>
                                            setData('sub_block', e.target.value)
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="status" className="text-xs">
                                        Status
                                    </Label>
                                    <Input
                                        id="status"
                                        placeholder="e.g. active"
                                        value={data.status}
                                        onChange={(e) =>
                                            setData('status', e.target.value)
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="lat" className="text-xs">
                                        Latitude
                                    </Label>
                                    <Input
                                        id="lat"
                                        placeholder="-6.9175"
                                        value={data.latitude}
                                        onChange={(e) =>
                                            setData('latitude', e.target.value)
                                        }
                                        className="h-8 font-mono text-xs"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="lng" className="text-xs">
                                        Longitude
                                    </Label>
                                    <Input
                                        id="lng"
                                        placeholder="107.6191"
                                        value={data.longitude}
                                        onChange={(e) =>
                                            setData('longitude', e.target.value)
                                        }
                                        className="h-8 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="planting_year"
                                        className="text-xs"
                                    >
                                        Planting Year
                                    </Label>
                                    <Input
                                        id="planting_year"
                                        placeholder="e.g. 2022"
                                        value={data.planting_year}
                                        onChange={(e) =>
                                            setData(
                                                'planting_year',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="propagation_method"
                                        className="text-xs"
                                    >
                                        Propagation
                                    </Label>
                                    <Input
                                        id="propagation_method"
                                        placeholder="e.g. Grafting"
                                        value={data.propagation_method}
                                        onChange={(e) =>
                                            setData(
                                                'propagation_method',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="description"
                                    className="text-xs"
                                >
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    placeholder="Optional notes..."
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs">Plant Photo</Label>
                                <ImageUpload
                                    value={data.image}
                                    onChange={(file) => setData('image', file)}
                                    onClear={() => setData('image', null)}
                                    error={errors.image}
                                />
                                {errors.image && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.image}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DrawerFooter className="px-6 pb-6">
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={handleSubmit}
                            disabled={processing || !data.plant_code.trim()}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3.5 w-3.5" /> Save Plant
                                </>
                            )}
                        </Button>
                        <DrawerClose asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

const ClusteredMap = forwardRef<
    ClusteredMapHandle,
    {
        gardenId: number;
        gardenPolygon: GeoJSON.Polygon | null;
        canEdit: boolean;
        onPlantClick: (plantId: number) => void;
        onMapClick: (coords: [number, number]) => void;
    }
>(({ gardenId, gardenPolygon, canEdit, onPlantClick, onMapClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapReadyRef = useRef(false);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAndUpdate = useCallback(
        async (map: maplibregl.Map) => {
            try {
                const res = await fetch(
                    `/gardens/${gardenId}/plants/coordinates`,
                );
                const plants: PlantCoord[] = await res.json();
                const geojson: GeoJSON.FeatureCollection = {
                    type: 'FeatureCollection',
                    features: plants.map((p) => ({
                        type: 'Feature' as const,
                        geometry: {
                            type: 'Point' as const,
                            coordinates: [
                                parseFloat(p.longitude),
                                parseFloat(p.latitude),
                            ],
                        },
                        properties: {
                            id: p.id,
                            plant_code: p.plant_code,
                            variety: p.variety ?? '',
                            block: p.block ?? '',
                            status: p.status ?? '',
                        },
                    })),
                };
                const src = map.getSource('plants') as
                    | maplibregl.GeoJSONSource
                    | undefined;
                if (src) {
                    src.setData(geojson);
                } else {
                    map.addSource('plants', {
                        type: 'geojson',
                        data: geojson,
                        cluster: true,
                        clusterMaxZoom: 16,
                        clusterRadius: 40,
                    });

                    map.addLayer({
                        id: 'clusters',
                        type: 'circle',
                        source: 'plants',
                        filter: ['has', 'point_count'],
                        paint: {
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                '#4ade80',
                                10,
                                '#22c55e',
                                50,
                                '#16a34a',
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                18,
                                10,
                                24,
                                50,
                                32,
                            ],
                            'circle-opacity': 0.9,
                            'circle-stroke-width': 2.5,
                            'circle-stroke-color': '#fff',
                        },
                    });

                    map.addLayer({
                        id: 'cluster-count',
                        type: 'symbol',
                        source: 'plants',
                        filter: ['has', 'point_count'],
                        layout: {
                            'text-field': ['get', 'point_count_abbreviated'],
                            'text-size': 11,
                        },
                        paint: { 'text-color': '#fff' },
                    });

                    map.addLayer({
                        id: 'unclustered-point',
                        type: 'symbol',
                        source: 'plants',
                        filter: ['!', ['has', 'point_count']],
                        layout: {
                            'icon-image': 'sprout-marker',
                            'icon-size': 1,
                            'icon-allow-overlap': true,
                            'icon-anchor': 'center',
                        },
                    });

                    map.on('click', 'clusters', (e) => {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['clusters'],
                        });
                        const clusterId = features[0]?.properties?.cluster_id;
                        if (!clusterId) return;
                        (
                            map.getSource('plants') as maplibregl.GeoJSONSource
                        ).getClusterExpansionZoom(clusterId);
                    });

                    map.on('click', 'unclustered-point', (e) => {
                        const properties = e.features?.[0]?.properties;
                        if (properties && properties.id) {
                            onPlantClick(Number(properties.id));
                        }
                    });

                    map.on('mouseenter', 'clusters', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });
                    map.on('mouseleave', 'clusters', () => {
                        map.getCanvas().style.cursor = '';
                    });
                    map.on('mouseenter', 'unclustered-point', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });
                    map.on('mouseleave', 'unclustered-point', () => {
                        map.getCanvas().style.cursor = '';
                    });

                    if (canEdit) {
                        map.on('click', (e) => {
                            const hits = map.queryRenderedFeatures(e.point, {
                                layers: ['unclustered-point', 'clusters'],
                            });
                            if (hits.length === 0)
                                onMapClick([e.lngLat.lng, e.lngLat.lat]);
                        });
                    }
                }
            } finally {
                setLoading(false);
            }
        },
        [gardenId, canEdit, onPlantClick, onMapClick],
    );

    const flyTo = useCallback((coords: [number, number], zoom: number = 16) => {
        if (mapRef.current && mapReadyRef.current) {
            mapRef.current.flyTo({
                center: coords,
                zoom: zoom,
                duration: 1500,
            });
        }
    }, []);

    const addMarker = useCallback((coords: [number, number]) => {
        if (mapRef.current && mapReadyRef.current) {
            if (markerRef.current) {
                markerRef.current.remove();
            }

            const el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundColor = '#3b82f6';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.borderRadius = '50%';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

            markerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat(coords)
                .addTo(mapRef.current!);
        }
    }, []);

    useImperativeHandle(ref, () => ({
        refreshPlants: async () => {
            if (mapRef.current && mapReadyRef.current) {
                await fetchAndUpdate(mapRef.current);
            }
        },
        flyTo,
        addMarker,
    }));

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [107.6191, -6.9175],
            zoom: 13,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

        map.on('load', async () => {
            await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    map.addImage('sprout-marker', img, { pixelRatio: 1 });
                    resolve();
                };

                img.onerror = () => resolve();
                img.src = 'data:image/svg+xml,' + encodeURIComponent(svgMarker);
            });

            if (gardenPolygon) {
                map.addSource('garden-area', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: gardenPolygon,
                        properties: {},
                    } as GeoJSON.Feature,
                });
                map.addLayer({
                    id: 'garden-fill',
                    type: 'fill',
                    source: 'garden-area',
                    paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.1 },
                });
                map.addLayer({
                    id: 'garden-stroke',
                    type: 'line',
                    source: 'garden-area',
                    paint: {
                        'line-color': '#15803d',
                        'line-width': 2,
                        'line-dasharray': [2, 1],
                    },
                });
                const coords = gardenPolygon.coordinates[0] as [
                    number,
                    number,
                ][];
                const lngs = coords.map((c) => c[0]);
                const lats = coords.map((c) => c[1]);
                map.fitBounds(
                    [
                        [Math.min(...lngs), Math.min(...lats)],
                        [Math.max(...lngs), Math.max(...lats)],
                    ],
                    { padding: 60, duration: 800 },
                );
            }

            mapReadyRef.current = true;
            await fetchAndUpdate(map);
        });

        mapRef.current = map;
        return () => {
            mapReadyRef.current = false;
            map.remove();
            mapRef.current = null;
        };
    }, []);

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
            {loading && (
                <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border bg-background/95 px-3.5 py-1.5 text-xs font-medium shadow-md backdrop-blur">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        Loading plants...
                    </div>
                </div>
            )}
            {canEdit && !loading && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
                    <div className="rounded-full border bg-background/90 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground shadow backdrop-blur">
                        Click empty area on map to add a plant
                    </div>
                </div>
            )}
        </div>
    );
});

ClusteredMap.displayName = 'ClusteredMap';

function PlantListPagination({ paginator }: { paginator: Paginator }) {
    const goTo = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveScroll: true, preserveState: true });
    };
    const pages: (number | '...')[] = [];
    const { current_page: cur, last_page: last } = paginator;
    for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || (i >= cur - 1 && i <= cur + 1))
            pages.push(i);
        else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background px-4 py-2.5 sm:px-6">
            <p className="text-xs text-muted-foreground">
                {paginator.from ?? 0}–{paginator.to ?? 0} of {paginator.total}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!paginator.prev_page_url}
                    onClick={() => goTo(paginator.prev_page_url)}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span
                            key={i}
                            className="px-1 text-xs text-muted-foreground"
                        >
                            ...
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === cur ? 'default' : 'outline'}
                            size="icon"
                            className="h-7 w-7 text-xs"
                            onClick={() =>
                                router.get(
                                    window.location.pathname,
                                    {
                                        ...Object.fromEntries(
                                            new URLSearchParams(
                                                window.location.search,
                                            ),
                                        ),
                                        page: String(p),
                                    },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                )
                            }
                        >
                            {p}
                        </Button>
                    ),
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!paginator.next_page_url}
                    onClick={() => goTo(paginator.next_page_url)}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

export default function ShowGarden({ garden: g, plants, filters }: Props) {
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
    const [plantDetailOpen, setPlantDetailOpen] = useState(false);
    const [addPlantOpen, setAddPlantOpen] = useState(false);
    const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(
        null,
    );
    const [search, setSearch] = useState(filters?.search ?? '');
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);
    const [isLoadingPlant, setIsLoadingPlant] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const mapRef = useRef<ClusteredMapHandle>(null);

    const myRole = g.members?.[0];
    const canEdit = myRole?.role === 'OWNER' || myRole?.role === 'MANAGER';
    const totalPlants = plants?.total ?? 0;
    const plantRows = plants?.data ?? [];

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
            },
            () => {
                setLocationDenied(true);
                setLocationDialogOpen(true);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, [locationDenied]);

    const handlePlantClickFromList = useCallback((plant: Plant) => {
        setSelectedPlant(plant);
        setPlantDetailOpen(true);
    }, []);

    const handlePlantClickFromMap = useCallback(
        async (plantId: number) => {
            try {
                setIsLoadingPlant(true);
                const response = await fetch(
                    `/gardens/${g.id}/plants/${plantId}`,
                );
                if (!response.ok)
                    throw new Error('Failed to fetch plant details');
                const plant = await response.json();
                setSelectedPlant(plant);
                setPlantDetailOpen(true);
            } catch (error) {
                console.error('Failed to fetch plant details:', error);
            } finally {
                setIsLoadingPlant(false);
            }
        },
        [g.id],
    );

    const handleMapClick = useCallback((coords: [number, number]) => {
        setPendingCoords(coords);
        setAddPlantOpen(true);
    }, []);

    const handlePlantAdded = useCallback(() => {
        mapRef.current?.refreshPlants();
    }, []);

    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
                router.get(
                    garden.show(g.id),
                    {
                        search: value,
                        per_page: filters?.per_page ?? 50,
                        page: 1,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }, 400);
        },
        [g.id, filters?.per_page],
    );

    return (
        <>
            <Head title={g.name} />

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
                                : 'This app needs your GPS location to center the map and help you locate plants.'}
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
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-semibold tracking-tight">
                            {g.name}
                        </h1>
                        {g.location && (
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{g.location}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={requestLocation}
                            className="h-7 gap-1.5 text-xs"
                        >
                            <Crosshair className="h-3.5 w-3.5" /> My Location
                        </Button>
                        {canEdit && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="hidden h-7 gap-1.5 text-xs sm:flex"
                            >
                                <Link href={garden.edit(g.id)}>
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                </Link>
                            </Button>
                        )}
                        {canEdit && (
                            <Button
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => {
                                    setPendingCoords(null);
                                    setAddPlantOpen(true);
                                }}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Add Plant
                                </span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 border-b bg-background/80 px-4 py-2 backdrop-blur sm:px-6">
                    <TooltipProvider delayDuration={300}>
                        <div className="flex items-center gap-0.5 rounded-md border bg-muted/50 p-0.5">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-7 w-7',
                                            viewMode === 'map' &&
                                                'bg-background shadow-sm',
                                        )}
                                        onClick={() => setViewMode('map')}
                                    >
                                        <MapIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Map view</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-7 w-7',
                                            viewMode === 'list' &&
                                                'bg-background shadow-sm',
                                        )}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <LayoutList className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>List view</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Leaf className="h-3.5 w-3.5" />
                        <span>
                            {totalPlants} plant{totalPlants !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {viewMode === 'list' && (
                        <div className="relative ml-2 max-w-xs flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search plants..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="h-7 pl-8 text-xs"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {viewMode === 'map' ? (
                        <>
                            <div className="relative flex-1 overflow-hidden">
                                <ClusteredMap
                                    ref={mapRef}
                                    gardenId={g.id}
                                    gardenPolygon={g.area}
                                    canEdit={canEdit}
                                    onPlantClick={handlePlantClickFromMap}
                                    onMapClick={handleMapClick}
                                />
                            </div>
                            <div className="hidden w-[260px] shrink-0 border-l bg-background lg:flex lg:flex-col xl:w-[280px]">
                                <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Garden Info
                                    </p>
                                </div>
                                <GardenInfoPanel g={g} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-1 flex-col overflow-hidden">
                                {plantRows.length === 0 ? (
                                    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted/50">
                                            <Sprout
                                                className="h-7 w-7 text-muted-foreground/30"
                                                strokeWidth={1.25}
                                            />
                                        </div>
                                        <p className="text-sm font-medium">
                                            {search
                                                ? 'No plants found'
                                                : 'No plants yet'}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {search
                                                ? 'Try a different keyword.'
                                                : 'Add plants to this garden to get started.'}
                                        </p>
                                        {!search && canEdit && (
                                            <Button
                                                size="sm"
                                                className="mt-5 gap-1.5"
                                                onClick={() => {
                                                    setPendingCoords(null);
                                                    setAddPlantOpen(true);
                                                }}
                                            >
                                                <Plus className="h-3.5 w-3.5" />{' '}
                                                Add Plant
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30">
                                                        <TableHead className="w-28 pl-4 text-[10px] font-medium tracking-wider uppercase sm:pl-6">
                                                            Code
                                                        </TableHead>
                                                        <TableHead className="text-[10px] font-medium tracking-wider uppercase">
                                                            Variety
                                                        </TableHead>
                                                        <TableHead className="hidden text-[10px] font-medium tracking-wider uppercase sm:table-cell">
                                                            Block
                                                        </TableHead>
                                                        <TableHead className="hidden text-[10px] font-medium tracking-wider uppercase md:table-cell">
                                                            Year
                                                        </TableHead>
                                                        <TableHead className="hidden text-[10px] font-medium tracking-wider uppercase lg:table-cell">
                                                            Propagation
                                                        </TableHead>
                                                        <TableHead className="text-[10px] font-medium tracking-wider uppercase">
                                                            Status
                                                        </TableHead>
                                                        <TableHead className="w-7 pr-4 sm:pr-6" />
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {plantRows.map((plant) => (
                                                        <TableRow
                                                            key={plant.id}
                                                            className="cursor-pointer hover:bg-muted/40"
                                                            onClick={() =>
                                                                handlePlantClickFromList(
                                                                    plant,
                                                                )
                                                            }
                                                        >
                                                            <TableCell className="pl-4 font-mono text-xs font-medium sm:pl-6">
                                                                {
                                                                    plant.plant_code
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {plant.variety ?? (
                                                                    <span className="text-muted-foreground/40">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="hidden text-sm sm:table-cell">
                                                                {plant.block ?? (
                                                                    <span className="text-muted-foreground/40">
                                                                        —
                                                                    </span>
                                                                )}
                                                                {plant.sub_block && (
                                                                    <span className="text-muted-foreground">
                                                                        {' '}
                                                                        /
                                                                        {
                                                                            plant.sub_block
                                                                        }
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="hidden text-sm md:table-cell">
                                                                {plant.planting_year ?? (
                                                                    <span className="text-muted-foreground/40">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="hidden text-sm lg:table-cell">
                                                                {plant.propagation_method ?? (
                                                                    <span className="text-muted-foreground/40">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {plant.status ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            'text-[10px]',
                                                                            getStatusCls(
                                                                                plant.status,
                                                                            ),
                                                                        )}
                                                                    >
                                                                        {
                                                                            plant.status
                                                                        }
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground/40">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="pr-4 sm:pr-6">
                                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        {(plants.last_page > 1 ||
                                            plants.total > 25) && (
                                            <PlantListPagination
                                                paginator={plants}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="hidden w-[260px] shrink-0 border-l bg-background lg:flex lg:flex-col xl:w-[280px]">
                                <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Garden Info
                                    </p>
                                </div>
                                <GardenInfoPanel g={g} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <PlantDetailDrawer
                plant={selectedPlant}
                open={plantDetailOpen}
                onClose={() => {
                    setPlantDetailOpen(false);
                    setSelectedPlant(null);
                }}
            />

            <AddPlantDrawer
                open={addPlantOpen}
                onClose={() => {
                    setAddPlantOpen(false);
                    setPendingCoords(null);
                }}
                gardenId={g.id}
                initialCoords={pendingCoords}
                onPlantAdded={handlePlantAdded}
            />
        </>
    );
}
