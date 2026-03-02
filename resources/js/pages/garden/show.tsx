import AppLayout from '@/layouts/app-layout';
import garden from '@/routes/garden';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
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
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Crosshair,
    Image as ImageIcon,
    Info,
    LayoutList,
    Leaf,
    Loader2,
    LocateFixed,
    Map as MapIcon,
    MapPin,
    Pencil,
    Plus,
    Search,
    Sprout,
    Trash2,
    X,
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
import { useTranslation } from 'react-i18next';
import { format, parse, isValid } from 'date-fns';
import { markerAlive, markerDead } from '@/pages/garden/lib/utils';

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
    planting_replacement: string | null;
    parent_tree_type: string | null;
    parent_tree_class: string | null;
    registration_number: string | null;
    parent_tree_notes: string | null;
    image_url?: string | null;
    image_path?: string | null;
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

// Coord-picking callback ref type
type PickingCallback = ((coords: [number, number]) => void) | null;

interface ClusteredMapHandle {
    refreshPlants: () => Promise<void>;
    flyTo: (coords: [number, number], zoom?: number) => void;
    addMarker: (coords: [number, number]) => void;
    startPickingCoord: (cb: (coords: [number, number]) => void) => void;
    stopPickingCoord: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatDate(iso: string | null | undefined) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('id-ID', {
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
        alive: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
        active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
        dead: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        removed:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        inactive: 'bg-muted text-muted-foreground border-border',
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

// ─── SVG marker builders ──────────────────────────────────────────────────────

function buildSproutSvg(fill: string): string {
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">`,
        `<circle cx="16" cy="16" r="16" fill="${fill}"/>`,
        `<g transform="translate(4,4) scale(0.667)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">`,
        `<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>`,
        `<path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/>`,
        `<path d="M5 21h14"/>`,
        `</g></svg>`,
    ].join('');
}

async function loadMapImage(
    map: maplibregl.Map,
    name: string,
    svg: string,
): Promise<void> {
    return new Promise<void>((resolve) => {
        const size = 32;
        const img = new Image();
        img.onload = () => {
            if (!map.hasImage(name)) {
                map.addImage(name, img, { pixelRatio: 2 });
            }
            resolve();
        };
        img.onerror = () => resolve();
        img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
    });
}

// ─── DatePicker helper ────────────────────────────────────────────────────────

function DatePickerField({
    label,
    value,
    onChange,
    className,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const selected = parsed && isValid(parsed) ? parsed : undefined;

    return (
        <div className={cn('grid gap-1.5', className)}>
            <Label className="text-xs">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            'h-8 justify-start gap-2 text-left text-sm font-normal',
                            !selected && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                        {selected ? (
                            format(selected, 'dd MMM yyyy')
                        ) : (
                            <span>Pilih tanggal</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selected}
                        onSelect={(d) => {
                            onChange(d ? format(d, 'yyyy-MM-dd') : '');
                            setOpen(false);
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─── Plant form data ──────────────────────────────────────────────────────────

interface PlantFormData {
    plant_code: string;
    variety: string;
    block: string;
    sub_block: string;
    latitude: string;
    longitude: string;
    planting_year: string;
    propagation_method: string;
    rootstock: string;
    seed_origin: string;
    description: string;
    status: string;
    status_change_date: string;
    status_change_reason: string;
    planting_replacement: string;
    parent_tree_type: string;
    parent_tree_class: string;
    registration_number: string;
    parent_tree_notes: string;
    image: File | null;
    remove_image: boolean;
}

const EMPTY_FORM: PlantFormData = {
    plant_code: '',
    variety: '',
    block: '',
    sub_block: '',
    latitude: '',
    longitude: '',
    planting_year: '',
    propagation_method: '',
    rootstock: '',
    seed_origin: '',
    description: '',
    status: '',
    status_change_date: '',
    status_change_reason: '',
    planting_replacement: '',
    parent_tree_type: '',
    parent_tree_class: '',
    registration_number: '',
    parent_tree_notes: '',
    image: null,
    remove_image: false,
};

function plantToForm(p: Plant): PlantFormData {
    return {
        plant_code: p.plant_code,
        variety: p.variety ?? '',
        block: p.block ?? '',
        sub_block: p.sub_block ?? '',
        latitude: p.latitude ?? '',
        longitude: p.longitude ?? '',
        planting_year: p.planting_year ? String(p.planting_year) : '',
        propagation_method: p.propagation_method ?? '',
        rootstock: p.rootstock ?? '',
        seed_origin: p.seed_origin ?? '',
        description: p.description ?? '',
        status: p.status ?? '',
        status_change_date: p.status_change_date ?? '',
        status_change_reason: p.status_change_reason ?? '',
        planting_replacement: p.planting_replacement ?? '',
        parent_tree_type: p.parent_tree_type ?? '',
        parent_tree_class: p.parent_tree_class ?? '',
        registration_number: p.registration_number ?? '',
        parent_tree_notes: p.parent_tree_notes ?? '',
        image: null,
        remove_image: false,
    };
}

// ─── GardenInfoPanel ─────────────────────────────────────────────────────────

function GardenInfoPanel({ g }: { g: GardenDetail }) {
    const { t } = useTranslation(['garden', 'common']);
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
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-green-500 to-emerald-400" />
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
                            {t('garden:common.area')}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {g.area_hectares
                                ? `${parseFloat(g.area_hectares).toFixed(2)} ${t('garden:common.areaUnit', 'ha')}`
                                : '—'}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                            {t('garden:common.members')}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {g.members.length}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        {t('garden:show.team')}
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
                    {t('common:created')} {formatDate(g.created_at)}
                </div>

                {(myRole?.role === 'OWNER' || myRole?.role === 'MANAGER') && (
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                    >
                        <Link href={garden.edit(g.id)}>
                            <Pencil className="h-3.5 w-3.5" />{' '}
                            {t('common:edit')} {t('garden:common.garden')}
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── PlantDetailDrawer (read-only view) ──────────────────────────────────────

function PlantDetailDrawer({
    plant,
    open,
    onClose,
    onEdit,
    canEdit,
}: {
    plant: Plant | null;
    open: boolean;
    onClose: () => void;
    onEdit: (plant: Plant) => void;
    canEdit: boolean;
}) {
    const { t } = useTranslation(['garden', 'common']);

    return (
        <Drawer open={open} onOpenChange={(v) => !v && onClose()} modal={true}>
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
                                    <div className="flex shrink-0 items-center gap-2">
                                        {plant.status && (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[11px]',
                                                    getStatusCls(plant.status),
                                                )}
                                            >
                                                {t(
                                                    `garden:show.statuses.${plant.status.toLowerCase()}`,
                                                    plant.status,
                                                )}
                                            </Badge>
                                        )}
                                        {canEdit && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => {
                                                    onClose();
                                                    // Small delay so detail drawer closes first
                                                    setTimeout(
                                                        () => onEdit(plant),
                                                        150,
                                                    );
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="max-h-[60vh] overflow-y-auto px-4 pb-2">
                                <div className="grid gap-4">
                                    {(plant.block || plant.sub_block) && (
                                        <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                                            <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                {t('garden:show.plantLocation')}
                                            </p>
                                            <div className="flex gap-6">
                                                {plant.block && (
                                                    <InfoRow
                                                        label={t(
                                                            'garden:show.block',
                                                        )}
                                                        value={plant.block}
                                                    />
                                                )}
                                                {plant.sub_block && (
                                                    <InfoRow
                                                        label={t(
                                                            'garden:show.subBlock',
                                                        )}
                                                        value={plant.sub_block}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        <InfoRow
                                            label={t(
                                                'garden:show.plantingYear',
                                            )}
                                            value={plant.planting_year}
                                        />
                                        <InfoRow
                                            label={t('garden:show.propagation')}
                                            value={plant.propagation_method}
                                        />
                                        <InfoRow
                                            label={t('garden:show.rootstock')}
                                            value={plant.rootstock}
                                        />
                                        <InfoRow
                                            label={t('garden:show.seedOrigin')}
                                            value={plant.seed_origin}
                                        />
                                        <InfoRow
                                            label={t(
                                                'garden:show.registrationNumber',
                                            )}
                                            value={plant.registration_number}
                                        />
                                        {plant.planting_replacement && (
                                            <InfoRow
                                                label={t(
                                                    'garden:show.plantingReplacement',
                                                )}
                                                value={
                                                    plant.planting_replacement
                                                }
                                            />
                                        )}
                                    </div>

                                    {plant.description && (
                                        <div>
                                            <p className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                {t('common:description')}
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
                                                    {t(
                                                        'garden:show.parentTree',
                                                    )}
                                                </p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InfoRow
                                                        label={t(
                                                            'garden:show.parentType',
                                                        )}
                                                        value={
                                                            plant.parent_tree_type
                                                        }
                                                    />
                                                    <InfoRow
                                                        label={t(
                                                            'garden:show.parentClass',
                                                        )}
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
                                                    {t(
                                                        'garden:show.statusChange',
                                                    )}
                                                </p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InfoRow
                                                        label={t(
                                                            'garden:show.statusChangeDate',
                                                        )}
                                                        value={formatDate(
                                                            plant.status_change_date,
                                                        )}
                                                    />
                                                    <InfoRow
                                                        label={t(
                                                            'garden:show.statusChangeReason',
                                                        )}
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
                                                {t('garden:show.coordinates')}
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
                                                {t('garden:show.photo')}
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
                                        {t('common:close')}
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

// ─── PlantFormDrawer (add + edit unified, no backdrop, coord picking) ─────────

function PlantFormDrawer({
    open,
    onClose,
    gardenId,
    plantId,
    initialCoords,
    initialData,
    existingImageUrl,
    onSaved,
    mapRef,
}: {
    open: boolean;
    onClose: () => void;
    gardenId: number;
    plantId?: number | null;
    initialCoords: [number, number] | null;
    initialData: PlantFormData | null;
    existingImageUrl?: string | null;
    onSaved?: () => void;
    mapRef: React.RefObject<ClusteredMapHandle | null>;
}) {
    const { t } = useTranslation(['garden', 'common']);
    const isEdit = !!plantId;
    const [isPickingCoord, setIsPickingCoord] = useState(false);

    const { data, setData, processing, errors, reset, transform, submit } =
        useForm<PlantFormData>(EMPTY_FORM);

    // Populate or reset when open state changes
    useEffect(() => {
        if (!open) return;
        if (initialData) {
            // Edit mode – fill all fields
            (Object.keys(initialData) as (keyof PlantFormData)[]).forEach(
                (k) => {
                    setData(k, initialData[k] as any);
                },
            );
        } else {
            reset();
            if (initialCoords) {
                setData('latitude', initialCoords[1].toFixed(6));
                setData('longitude', initialCoords[0].toFixed(6));
            }
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync coord if user clicks map while drawer open (add mode)
    useEffect(() => {
        if (open && !isEdit && initialCoords) {
            setData('latitude', initialCoords[1].toFixed(6));
            setData('longitude', initialCoords[0].toFixed(6));
        }
    }, [initialCoords]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = () => {
        setIsPickingCoord(false);
        mapRef.current?.stopPickingCoord();
        reset();
        onClose();
    };

    const handlePickCoord = () => {
        setIsPickingCoord(true);
        mapRef.current?.startPickingCoord((coords) => {
            setData('latitude', coords[1].toFixed(6));
            setData('longitude', coords[0].toFixed(6));
            setIsPickingCoord(false);
        });
    };

    const handleCancelPicking = () => {
        setIsPickingCoord(false);
        mapRef.current?.stopPickingCoord();
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
            if (d.rootstock) fd.append('rootstock', d.rootstock);
            if (d.seed_origin) fd.append('seed_origin', d.seed_origin);
            if (d.description) fd.append('description', d.description);
            if (d.status) fd.append('status', d.status);
            if (d.status_change_date)
                fd.append('status_change_date', d.status_change_date);
            if (d.status_change_reason)
                fd.append('status_change_reason', d.status_change_reason);
            if (d.planting_replacement)
                fd.append('planting_replacement', d.planting_replacement);
            if (d.parent_tree_type)
                fd.append('parent_tree_type', d.parent_tree_type);
            if (d.parent_tree_class)
                fd.append('parent_tree_class', d.parent_tree_class);
            if (d.registration_number)
                fd.append('registration_number', d.registration_number);
            if (d.parent_tree_notes)
                fd.append('parent_tree_notes', d.parent_tree_notes);
            if (d.image) fd.append('image', d.image);
            if (isEdit && d.remove_image) fd.append('remove_image', '1');
            if (isEdit) fd.append('_method', 'PUT');
            return fd;
        });

        const url = isEdit
            ? `/gardens/${gardenId}/plants/${plantId}`
            : `/gardens/${gardenId}/plants`;

        submit('post', url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
                onSaved?.();
            },
        });
    };

    return (
        <Drawer
            open={open}
            onOpenChange={(v) => {
                // Don't close while user is in coord-picking mode
                if (!v && !isPickingCoord) handleClose();
            }}
            // No backdrop – user can interact with map
            modal={false}
            direction="right"
        >
            <DrawerContent className="!inset-y-0 right-0 left-auto flex h-full w-full max-w-md flex-col rounded-none border-l">
                {/* Header */}
                <DrawerHeader className="shrink-0 border-b px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <DrawerTitle className="flex items-center gap-2">
                            <Sprout className="h-4 w-4 text-primary" />
                            {isEdit
                                ? t('garden:show.editPlant')
                                : t('garden:show.addPlant')}
                        </DrawerTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <DrawerDescription className="mt-1">
                        {isEdit
                            ? t('garden:show.editPlantDesc')
                            : t('garden:show.addPlantDesc')}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Coord-picking banner */}
                {isPickingCoord && (
                    <div className="shrink-0 border-b bg-blue-50 px-6 py-2.5 dark:bg-blue-950/60">
                        <div className="flex items-center gap-2">
                            <LocateFixed className="h-3.5 w-3.5 animate-pulse text-blue-600 dark:text-blue-400" />
                            <p className="flex-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                {t('garden:show.pickingCoord')}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-300"
                                onClick={handleCancelPicking}
                            >
                                {t('common:cancel')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="grid gap-3">
                        {/* Kode Tanaman */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="pf_plant_code" className="text-xs">
                                {t('garden:show.plantCode')}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="pf_plant_code"
                                placeholder={t(
                                    'garden:show.plantCodePlaceholder',
                                )}
                                value={data.plant_code}
                                onChange={(e) =>
                                    setData('plant_code', e.target.value)
                                }
                                className={cn(
                                    'h-8 text-sm',
                                    errors.plant_code && 'border-destructive',
                                )}
                            />
                            {errors.plant_code && (
                                <p className="text-[11px] text-destructive">
                                    {errors.plant_code}
                                </p>
                            )}
                        </div>

                        {/* Varietas + Blok */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="pf_variety" className="text-xs">
                                    {t('garden:show.variety')}
                                </Label>
                                <Input
                                    id="pf_variety"
                                    placeholder={t(
                                        'garden:show.varietyPlaceholder',
                                    )}
                                    value={data.variety}
                                    onChange={(e) =>
                                        setData('variety', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="pf_block" className="text-xs">
                                    {t('garden:show.block')}
                                </Label>
                                <Input
                                    id="pf_block"
                                    placeholder={t(
                                        'garden:show.blockPlaceholder',
                                    )}
                                    value={data.block}
                                    onChange={(e) =>
                                        setData('block', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Sub Blok + Tgl Tanam */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_sub_block"
                                    className="text-xs"
                                >
                                    {t('garden:show.subBlock')}
                                </Label>
                                <Input
                                    id="pf_sub_block"
                                    placeholder={t(
                                        'garden:show.subBlockPlaceholder',
                                    )}
                                    value={data.sub_block}
                                    onChange={(e) =>
                                        setData('sub_block', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_planting_year"
                                    className="text-xs"
                                >
                                    {t('garden:show.plantingYear')}
                                </Label>
                                <Input
                                    id="pf_planting_year"
                                    placeholder={t(
                                        'garden:show.plantingYearPlaceholder',
                                    )}
                                    value={data.planting_year}
                                    onChange={(e) =>
                                        setData('planting_year', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Cara Perbanyakan + Batang Bawah */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_propagation"
                                    className="text-xs"
                                >
                                    {t('garden:show.propagation')}
                                </Label>
                                <Input
                                    id="pf_propagation"
                                    placeholder={t(
                                        'garden:show.propagationPlaceholder',
                                    )}
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
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_rootstock"
                                    className="text-xs"
                                >
                                    {t('garden:show.rootstock')}
                                </Label>
                                <Input
                                    id="pf_rootstock"
                                    placeholder={t(
                                        'garden:show.rootstockPlaceholder',
                                    )}
                                    value={data.rootstock}
                                    onChange={(e) =>
                                        setData('rootstock', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Asal Bibit + No Registrasi */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_seed_origin"
                                    className="text-xs"
                                >
                                    {t('garden:show.seedOrigin')}
                                </Label>
                                <Input
                                    id="pf_seed_origin"
                                    placeholder={t(
                                        'garden:show.seedOriginPlaceholder',
                                    )}
                                    value={data.seed_origin}
                                    onChange={(e) =>
                                        setData('seed_origin', e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_reg_number"
                                    className="text-xs"
                                >
                                    {t('garden:show.registrationNumber')}
                                </Label>
                                <Input
                                    id="pf_reg_number"
                                    placeholder={t(
                                        'garden:show.registrationNumberPlaceholder',
                                    )}
                                    value={data.registration_number}
                                    onChange={(e) =>
                                        setData(
                                            'registration_number',
                                            e.target.value,
                                        )
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="pf_description" className="text-xs">
                                {t('common:description')}
                            </Label>
                            <Textarea
                                id="pf_description"
                                placeholder={t(
                                    'garden:show.descriptionPlaceholder',
                                )}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className="min-h-[60px] resize-none text-sm"
                                rows={2}
                            />
                        </div>

                        {/* Status */}
                        <div className="grid gap-1.5">
                            <Label className="text-xs">
                                {t('garden:show.status')}
                            </Label>
                            <Select
                                value={data.status || undefined}
                                onValueChange={(v) => setData('status', v)}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue
                                        placeholder={t(
                                            'garden:show.statusPlaceholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALIVE">
                                        {t('garden:show.statuses.alive')}
                                    </SelectItem>
                                    <SelectItem value="DEAD">
                                        {t('garden:show.statuses.dead')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tanggal Perubahan Status + Sebab */}
                        <div className="grid grid-cols-2 gap-3">
                            <DatePickerField
                                label={t('garden:show.statusChangeDate')}
                                value={data.status_change_date}
                                onChange={(v) =>
                                    setData('status_change_date', v)
                                }
                            />
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pf_status_reason"
                                    className="text-xs"
                                >
                                    {t('garden:show.statusChangeReason')}
                                </Label>
                                <Input
                                    id="pf_status_reason"
                                    placeholder={t(
                                        'garden:show.statusChangeReasonPlaceholder',
                                    )}
                                    value={data.status_change_reason}
                                    onChange={(e) =>
                                        setData(
                                            'status_change_reason',
                                            e.target.value,
                                        )
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Pergantian Tanaman */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="pf_replacement" className="text-xs">
                                {t('garden:show.plantingReplacement')}
                            </Label>
                            <Input
                                id="pf_replacement"
                                placeholder={t(
                                    'garden:show.plantingReplacementPlaceholder',
                                )}
                                value={data.planting_replacement}
                                onChange={(e) =>
                                    setData(
                                        'planting_replacement',
                                        e.target.value,
                                    )
                                }
                                className="h-8 text-sm"
                            />
                        </div>

                        {/* Pohon Induk section */}
                        <div className="grid gap-2">
                            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                {t('garden:show.parentTree')}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pf_parent_type"
                                        className="text-xs"
                                    >
                                        {t('garden:show.parentType')}
                                    </Label>
                                    <Input
                                        id="pf_parent_type"
                                        placeholder={t(
                                            'garden:show.parentTypePlaceholder',
                                        )}
                                        value={data.parent_tree_type}
                                        onChange={(e) =>
                                            setData(
                                                'parent_tree_type',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pf_parent_class"
                                        className="text-xs"
                                    >
                                        {t('garden:show.parentClass')}
                                    </Label>
                                    <Input
                                        id="pf_parent_class"
                                        placeholder={t(
                                            'garden:show.parentClassPlaceholder',
                                        )}
                                        value={data.parent_tree_class}
                                        onChange={(e) =>
                                            setData(
                                                'parent_tree_class',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                            <Textarea
                                id="pf_parent_notes"
                                placeholder={t(
                                    'garden:show.parentNotesPlaceholder',
                                )}
                                value={data.parent_tree_notes}
                                onChange={(e) =>
                                    setData('parent_tree_notes', e.target.value)
                                }
                                className="min-h-[48px] resize-none text-sm"
                                rows={2}
                            />
                        </div>

                        {/* Koordinat + Pick from map */}
                        <div className="grid gap-1.5">
                            <Label className="text-xs">
                                {t('garden:show.coordinates')}
                            </Label>
                            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                                <div className="grid gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                        {t('garden:show.latitude')}
                                    </span>
                                    <Input
                                        placeholder="-6.9175"
                                        value={data.latitude}
                                        onChange={(e) =>
                                            setData('latitude', e.target.value)
                                        }
                                        className="h-8 font-mono text-xs"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                        {t('garden:show.longitude')}
                                    </span>
                                    <Input
                                        placeholder="107.6191"
                                        value={data.longitude}
                                        onChange={(e) =>
                                            setData('longitude', e.target.value)
                                        }
                                        className="h-8 font-mono text-xs"
                                    />
                                </div>
                                <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant={
                                                    isPickingCoord
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="icon"
                                                className={cn(
                                                    'h-8 w-8 shrink-0',
                                                    isPickingCoord &&
                                                        'animate-pulse',
                                                )}
                                                onClick={
                                                    isPickingCoord
                                                        ? handleCancelPicking
                                                        : handlePickCoord
                                                }
                                            >
                                                <LocateFixed className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                            {isPickingCoord
                                                ? t('common:cancel')
                                                : t('garden:show.pickCoord')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Foto */}
                        <div className="grid gap-1.5">
                            <Label className="text-xs">
                                {t('garden:show.plantPhoto')}
                            </Label>
                            {/* Show existing image in edit mode */}
                            {isEdit &&
                                existingImageUrl &&
                                !data.remove_image && (
                                    <div className="relative overflow-hidden rounded-lg border">
                                        <img
                                            src={existingImageUrl}
                                            alt="foto tanaman"
                                            className="max-h-32 w-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1.5 right-1.5 h-6 w-6"
                                            onClick={() =>
                                                setData('remove_image', true)
                                            }
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            {/* Show upload when: add mode, or edit+no existing, or edit+removed */}
                            {(!isEdit ||
                                !existingImageUrl ||
                                data.remove_image) && (
                                <ImageUpload
                                    value={data.image}
                                    onChange={(file) => setData('image', file)}
                                    onClear={() => setData('image', null)}
                                    error={errors.image}
                                />
                            )}
                            {errors.image && (
                                <p className="text-[11px] text-destructive">
                                    {errors.image}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky footer */}
                <DrawerFooter className="shrink-0 border-t px-6 pt-4 pb-6">
                    <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={handleSubmit}
                        disabled={processing || !data.plant_code.trim()}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
                                {t('common:saving')}
                            </>
                        ) : (
                            <>
                                <Plus className="h-3.5 w-3.5" />{' '}
                                {t('common:save')}
                            </>
                        )}
                    </Button>
                    <DrawerClose asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                        >
                            {t('common:cancel')}
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

// ─── ClusteredMap ─────────────────────────────────────────────────────────────

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
    const { t } = useTranslation('garden');
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapReadyRef = useRef(false);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const pickingRef = useRef<PickingCallback>(null);
    const [loading, setLoading] = useState(true);
    const [isPicking, setIsPicking] = useState(false);

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
                            status: (p.status ?? '').toLowerCase(),
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

                    // Cluster circle
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

                    // Cluster count label
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

                    // Unclustered markers – icon chosen by status:
                    // ALIVE → sprout-alive (green), DEAD → sprout-dead (red), else sprout-alive
                    map.addLayer({
                        id: 'unclustered-point',
                        type: 'symbol',
                        source: 'plants',
                        filter: ['!', ['has', 'point_count']],
                        layout: {
                            'icon-image': [
                                'match',
                                ['get', 'status'],
                                'dead',
                                'sprout-dead',
                                /* default */ 'sprout-alive',
                            ],
                            'icon-size': 2,
                            'icon-allow-overlap': true,
                            'icon-anchor': 'center',
                        },
                    });

                    // Click cluster → zoom in
                    map.on('click', 'clusters', (e) => {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['clusters'],
                        });
                        const clusterId = features[0]?.properties?.cluster_id;
                        if (!clusterId) return;
                        (map.getSource('plants') as maplibregl.GeoJSONSource)
                            .getClusterExpansionZoom(clusterId)
                            .then((zoom) =>
                                map.flyTo({
                                    center: (
                                        features[0].geometry as GeoJSON.Point
                                    ).coordinates as [number, number],
                                    zoom,
                                }),
                            );
                    });

                    // Click individual plant
                    map.on('click', 'unclustered-point', (e) => {
                        const props = e.features?.[0]?.properties;
                        if (props?.id) onPlantClick(Number(props.id));
                    });

                    // Cursors
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

                    // General map click for adding plant OR picking coord
                    map.on('click', (e) => {
                        const hits = map.queryRenderedFeatures(e.point, {
                            layers: ['unclustered-point', 'clusters'],
                        });
                        if (hits.length > 0) return;

                        const coords: [number, number] = [
                            e.lngLat.lng,
                            e.lngLat.lat,
                        ];

                        // If coord-picking mode is active, call the callback
                        if (pickingRef.current) {
                            pickingRef.current(coords);
                            pickingRef.current = null;
                            setIsPicking(false);
                            map.getCanvas().style.cursor = '';
                            return;
                        }

                        // Otherwise open add-plant drawer (if canEdit)
                        if (canEdit) onMapClick(coords);
                    });
                }
            } finally {
                setLoading(false);
            }
        },
        [gardenId, canEdit, onPlantClick, onMapClick],
    );

    const flyTo = useCallback((coords: [number, number], zoom = 16) => {
        if (mapRef.current && mapReadyRef.current) {
            mapRef.current.flyTo({ center: coords, zoom, duration: 1500 });
        }
    }, []);

    const addMarker = useCallback((coords: [number, number]) => {
        if (!mapRef.current || !mapReadyRef.current) return;
        markerRef.current?.remove();
        const el = document.createElement('div');
        el.style.cssText =
            'background:#3b82f6;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)';
        markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(mapRef.current);
    }, []);

    const startPickingCoord = useCallback(
        (cb: (coords: [number, number]) => void) => {
            pickingRef.current = cb;
            setIsPicking(true);
            if (mapRef.current)
                mapRef.current.getCanvas().style.cursor = 'crosshair';
        },
        [],
    );

    const stopPickingCoord = useCallback(() => {
        pickingRef.current = null;
        setIsPicking(false);
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
    }, []);

    useImperativeHandle(ref, () => ({
        refreshPlants: async () => {
            if (mapRef.current && mapReadyRef.current) {
                await fetchAndUpdate(mapRef.current);
            }
        },
        flyTo,
        addMarker,
        startPickingCoord,
        stopPickingCoord,
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
            // Load two marker images: green (alive) and red (dead)
            await Promise.all([
                loadMapImage(map, 'sprout-alive', markerAlive),
                loadMapImage(map, 'sprout-dead', markerDead),
            ]);

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full" />

            {loading && (
                <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border bg-background/95 px-3.5 py-1.5 text-xs font-medium shadow-md backdrop-blur">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        {t('common:loading')}
                    </div>
                </div>
            )}

            {/* Crosshair cursor indicator when picking */}
            {isPicking && (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/95 px-3.5 py-1.5 text-xs font-medium text-blue-700 shadow-md backdrop-blur dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-300">
                        <LocateFixed className="h-3.5 w-3.5 animate-pulse" />
                        {t('garden:show.clickMapToPickCoord')}
                    </div>
                </div>
            )}

            {canEdit && !loading && !isPicking && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
                    <div className="rounded-full border bg-background/90 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground shadow backdrop-blur">
                        {t('garden:show.mapClickHint')}
                    </div>
                </div>
            )}
        </div>
    );
});

ClusteredMap.displayName = 'ClusteredMap';

// ─── PlantListPagination ──────────────────────────────────────────────────────

function PlantListPagination({ paginator }: { paginator: Paginator }) {
    const { t } = useTranslation('common');
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
                {paginator.from ?? 0}–{paginator.to ?? 0} {t('of')}{' '}
                {paginator.total}
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

// ─── ShowGarden (main page) ───────────────────────────────────────────────────

export default function ShowGarden({ garden: g, plants, filters }: Props) {
    const { t } = useTranslation(['garden', 'common']);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

    // Detail drawer
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
    const [plantDetailOpen, setPlantDetailOpen] = useState(false);

    // Form drawer (add + edit)
    const [formOpen, setFormOpen] = useState(false);
    const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
    const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(
        null,
    );

    const [search, setSearch] = useState(filters?.search ?? '');
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const mapRef = useRef<ClusteredMapHandle>(null);

    const myRole = g.members?.[0];
    const canEdit = myRole?.role === 'OWNER' || myRole?.role === 'MANAGER';
    const totalPlants = plants?.total ?? 0;
    const plantRows = plants?.data ?? [];

    // ── Location helpers ───────────────────────────────────────────────────
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

    // ── Plant click handlers ───────────────────────────────────────────────
    const handlePlantClickFromList = useCallback((plant: Plant) => {
        setSelectedPlant(plant);
        setPlantDetailOpen(true);
    }, []);

    const handlePlantClickFromMap = useCallback(
        async (plantId: number) => {
            try {
                const response = await fetch(
                    `/gardens/${g.id}/plants/${plantId}`,
                );
                if (!response.ok) throw new Error('Failed to fetch');
                const plant = await response.json();
                setSelectedPlant(plant);
                setPlantDetailOpen(true);
            } catch (err) {
                console.error('Failed to fetch plant details:', err);
            }
        },
        [g.id],
    );

    // ── Map click → open add drawer ────────────────────────────────────────
    const handleMapClick = useCallback((coords: [number, number]) => {
        // Don't open add drawer if we're in coord-picking mode for edit
        setPendingCoords(coords);
        setEditingPlant(null);
        setFormOpen(true);
    }, []);

    // ── Open edit drawer ───────────────────────────────────────────────────
    const handleEditPlant = useCallback((plant: Plant) => {
        setEditingPlant(plant);
        setPendingCoords(null);
        setFormOpen(true);
    }, []);

    // ── After save ─────────────────────────────────────────────────────────
    const handleSaved = useCallback(() => {
        mapRef.current?.refreshPlants();
    }, []);

    // ── Search ─────────────────────────────────────────────────────────────
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

    // Derive initialData and existingImageUrl for PlantFormDrawer
    const editFormData = editingPlant ? plantToForm(editingPlant) : null;
    const editImageUrl = editingPlant?.image_url ?? null;

    return (
        <>
            <Head title={g.name} />

            {/* Location dialog */}
            <AlertDialog
                open={locationDialogOpen}
                onOpenChange={setLocationDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {locationDenied
                                ? t('garden:create.locationDialog.blockedTitle')
                                : t('garden:create.locationDialog.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {locationDenied
                                ? t('garden:create.locationDialog.blockedDesc')
                                : t('garden:create.locationDialog.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('common:cancel')}
                        </AlertDialogCancel>
                        {!locationDenied ? (
                            <AlertDialogAction onClick={handleGrantLocation}>
                                {t('garden:create.locationDialog.allow')}
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction
                                onClick={() => setLocationDialogOpen(false)}
                            >
                                {t('garden:create.locationDialog.gotIt')}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
                {/* Top bar */}
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
                            <Crosshair className="h-3.5 w-3.5" />{' '}
                            {t('garden:show.myLocation')}
                        </Button>
                        {canEdit && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="hidden h-7 gap-1.5 text-xs sm:flex"
                            >
                                <Link href={garden.edit(g.id)}>
                                    <Pencil className="h-3.5 w-3.5" />{' '}
                                    {t('common:edit')}
                                </Link>
                            </Button>
                        )}
                        {canEdit && (
                            <Button
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => {
                                    setEditingPlant(null);
                                    setPendingCoords(null);
                                    setFormOpen(true);
                                }}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    {t('garden:show.addPlant')}
                                </span>
                                <span className="sm:hidden">
                                    {t('common:add')}
                                </span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
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
                                <TooltipContent>
                                    {t('garden:show.mapView')}
                                </TooltipContent>
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
                                <TooltipContent>
                                    {t('garden:show.listView')}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Leaf className="h-3.5 w-3.5" />
                        <span>
                            {t('garden:show.totalPlants', {
                                count: totalPlants,
                            })}
                        </span>
                    </div>

                    {viewMode === 'list' && (
                        <div className="relative ml-2 max-w-xs flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('garden:show.searchPlants')}
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="h-7 pl-8 text-xs"
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
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
                            <div className="hidden w-65 shrink-0 border-l bg-background lg:flex lg:flex-col xl:w-70">
                                <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        {t('garden:show.info')}
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
                                                ? t(
                                                      'garden:show.noSearchResults',
                                                  )
                                                : t('garden:show.noPlants')}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {search
                                                ? t(
                                                      'garden:show.noSearchResultsDesc',
                                                  )
                                                : t('garden:show.noPlantsDesc')}
                                        </p>
                                        {!search && canEdit && (
                                            <Button
                                                size="sm"
                                                className="mt-5 gap-1.5"
                                                onClick={() => {
                                                    setEditingPlant(null);
                                                    setPendingCoords(null);
                                                    setFormOpen(true);
                                                }}
                                            >
                                                <Plus className="h-3.5 w-3.5" />{' '}
                                                {t('garden:show.addPlant')}
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
                                                            {t(
                                                                'garden:show.plantCode',
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="text-[10px] font-medium tracking-wider uppercase">
                                                            {t(
                                                                'garden:show.variety',
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="hidden text-[10px] font-medium tracking-wider uppercase sm:table-cell">
                                                            {t(
                                                                'garden:show.block',
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="hidden text-[10px] font-medium tracking-wider uppercase md:table-cell">
                                                            {t(
                                                                'garden:show.plantingYear',
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="hidden text-[10px] font-medium tracking-wider uppercase lg:table-cell">
                                                            {t(
                                                                'garden:show.propagation',
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="text-[10px] font-medium tracking-wider uppercase">
                                                            {t(
                                                                'garden:show.status',
                                                            )}
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
                                                                        {t(
                                                                            `garden:show.statuses.${plant.status.toLowerCase()}`,
                                                                            plant.status,
                                                                        )}
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
                            <div className="hidden w-65 shrink-0 border-l bg-background lg:flex lg:flex-col xl:w-70">
                                <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        {t('garden:show.info')}
                                    </p>
                                </div>
                                <GardenInfoPanel g={g} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Plant detail drawer (read-only) */}
            <PlantDetailDrawer
                plant={selectedPlant}
                open={plantDetailOpen}
                onClose={() => {
                    setPlantDetailOpen(false);
                    setSelectedPlant(null);
                }}
                onEdit={handleEditPlant}
                canEdit={canEdit}
            />

            {/* Unified plant form drawer (add + edit) */}
            <PlantFormDrawer
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingPlant(null);
                    setPendingCoords(null);
                }}
                gardenId={g.id}
                plantId={editingPlant?.id ?? null}
                initialCoords={pendingCoords}
                initialData={editFormData}
                existingImageUrl={editImageUrl}
                onSaved={handleSaved}
                mapRef={mapRef}
            />
        </>
    );
}
