import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import garden from '@/routes/garden';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    LayoutGrid,
    Leaf,
    List,
    MapPin,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Shapes,
    Trash2,
    Users,
    Eye,
} from 'lucide-react';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface GardenMember {
    id: number;
    role: string;
    user: { id: number; name: string; email: string };
}

interface Garden {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    area_hectares: string | null;
    image_url: string | null;
    created_at: string;
    members: GardenMember[];
    plants_count?: number;
}

interface Paginator {
    data: Garden[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    gardens: Paginator;
    filters: { search?: string; per_page?: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Gardens', href: garden.index() },
];

GardenIndex.layout = (page: ReactNode) => (
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
        label: 'Maintainer',
        cls: 'bg-muted text-muted-foreground border-border',
    };
}

function GardenCard({ g, userRole }: { g: Garden; userRole?: string }) {
    const { t } = useTranslation(['garden', 'common']);
    const badge = userRole ? getRoleBadge(userRole) : null;
    const canEdit = userRole === 'OWNER' || userRole === 'MANAGER';

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative h-36 w-full overflow-hidden bg-muted/50">
                {g.image_url ? (
                    <img
                        src={g.image_url}
                        alt={g.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon
                            className="h-8 w-8 text-muted-foreground/25"
                            strokeWidth={1.25}
                        />
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-green-500 to-emerald-400" />

                {badge && (
                    <div className="absolute top-2 left-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                'bg-background/80 text-[10px] font-medium backdrop-blur-sm',
                                badge.cls,
                            )}
                        >
                            {badge.label}
                        </Badge>
                    </div>
                )}

                {canEdit && (
                    <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7 bg-background/90 shadow-sm backdrop-blur-sm"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={garden.show(g.id)}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Eye className="h-3.5 w-3.5" />{' '}
                                        {t('common:view')}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={garden.edit(g.id)}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />{' '}
                                        {t('common:edit')}
                                    </Link>
                                </DropdownMenuItem>
                                {userRole === 'OWNER' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        t(
                                                            'garden:delete.confirmation',
                                                        ),
                                                    )
                                                )
                                                    router.delete(
                                                        garden.destroy(g.id),
                                                    );
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />{' '}
                                            {t('common:delete')}
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div>
                    <Link
                        href={garden.show(g.id)}
                        className="truncate text-sm leading-snug font-semibold"
                    >
                        {g.name}
                    </Link>
                    {g.description && (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                            {g.description}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                    {g.location && (
                        <span className="flex max-w-full items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" /> {g.location}
                        </span>
                    )}
                    {g.area_hectares && (
                        <span className="flex items-center gap-1">
                            <Shapes className="h-3 w-3" />{' '}
                            {parseFloat(g.area_hectares).toLocaleString('en')}{' '}
                            {t('garden:common.areaUnit', 'ha')}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {g.members.length}
                    </span>
                </div>

                {g.members.length > 0 && (
                    <div className="mt-auto flex items-center justify-between border-t pt-2">
                        <TooltipProvider delayDuration={200}>
                            <div className="flex -space-x-1.5">
                                {g.members.slice(0, 4).map((m) => (
                                    <Tooltip key={m.id}>
                                        <TooltipTrigger asChild>
                                            <div className="flex h-6 w-6 cursor-default items-center justify-center rounded-full border-2 border-card bg-accent text-[9px] font-bold">
                                                {initials(m.user.name)}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="text-xs"
                                        >
                                            {m.user.name} · {m.role}
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                {g.members.length > 4 && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold text-muted-foreground">
                                        +{g.members.length - 4}
                                    </div>
                                )}
                            </div>
                        </TooltipProvider>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />{' '}
                            {formatDate(g.created_at)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function GardenRow({ g, userRole }: { g: Garden; userRole?: string }) {
    const { t } = useTranslation(['garden', 'common']);
    const badge = userRole ? getRoleBadge(userRole) : null;
    const canEdit = userRole === 'OWNER' || userRole === 'MANAGER';

    return (
        <div className="group flex items-center gap-4 border-b px-6 py-3.5 transition-colors last:border-b-0 hover:bg-muted/30">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted/50">
                {g.image_url ? (
                    <img
                        src={g.image_url}
                        alt={g.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon
                            className="h-4 w-4 text-muted-foreground/30"
                            strokeWidth={1.25}
                        />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{g.name}</p>
                {g.description && (
                    <p className="truncate text-[12px] text-muted-foreground">
                        {g.description}
                    </p>
                )}
            </div>

            <div className="hidden w-40 min-w-0 md:block">
                {g.location ? (
                    <p className="flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /> {g.location}
                    </p>
                ) : (
                    <span className="text-[12px] text-muted-foreground/30">
                        —
                    </span>
                )}
            </div>

            <div className="hidden w-24 text-right text-sm md:block">
                {g.area_hectares ? (
                    <>
                        <span className="font-medium">
                            {parseFloat(g.area_hectares).toLocaleString('en')}
                        </span>{' '}
                        <span className="text-[11px] text-muted-foreground">
                            {t('garden:common.areaUnit', 'ha')}
                        </span>
                    </>
                ) : (
                    <span className="text-muted-foreground/30">—</span>
                )}
            </div>

            <div className="hidden w-16 text-center text-[12px] text-muted-foreground sm:block">
                {g.members.length}{' '}
                <span className="hidden lg:inline">
                    {t('garden:common.members', { count: g.members.length })}
                </span>
            </div>

            {badge && (
                <Badge
                    variant="outline"
                    className={cn(
                        'hidden shrink-0 text-[10px] lg:flex',
                        badge.cls,
                    )}
                >
                    {badge.label}
                </Badge>
            )}

            <div className="hidden shrink-0 text-[12px] text-muted-foreground xl:block">
                {formatDate(g.created_at)}
            </div>

            {canEdit && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                            <Link
                                href={garden.show(g.id)}
                                className="flex cursor-pointer items-center gap-2"
                            >
                                <Eye className="h-3.5 w-3.5" />{' '}
                                {t('common:view')}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href={garden.edit(g.id)}
                                className="flex cursor-pointer items-center gap-2"
                            >
                                <Pencil className="h-3.5 w-3.5" />{' '}
                                {t('common:edit')}
                            </Link>
                        </DropdownMenuItem>
                        {userRole === 'OWNER' && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                t('garden:delete.confirmation'),
                                            )
                                        )
                                            router.delete(garden.destroy(g.id));
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />{' '}
                                    {t('common:delete')}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

function Pagination({
    paginator,
    perPage,
    onPerPageChange,
}: {
    paginator: Paginator;
    perPage: number;
    onPerPageChange: (v: string) => void;
}) {
    const { t } = useTranslation(['garden', 'common']);
    const {
        current_page,
        last_page,
        from,
        to,
        total,
        prev_page_url,
        next_page_url,
    } = paginator;

    const goTo = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveScroll: true, preserveState: true });
    };

    const pages: (number | '...')[] = [];
    if (last_page <= 7) {
        for (let i = 1; i <= last_page; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current_page > 3) pages.push('...');
        for (
            let i = Math.max(2, current_page - 1);
            i <= Math.min(last_page - 1, current_page + 1);
            i++
        )
            pages.push(i);
        if (current_page < last_page - 2) pages.push('...');
        pages.push(last_page);
    }

    return (
        <div className="flex shrink-0 items-center justify-between border-t bg-background px-6 py-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                    {from ?? 0}–{to ?? 0} {t('common:of')}{' '}
                    <strong className="text-foreground">{total}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs">{t('common:rows')}:</span>
                    <Select
                        value={String(perPage)}
                        onValueChange={onPerPageChange}
                    >
                        <SelectTrigger className="h-7 w-17 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 25, 50, 100].map((n) => (
                                <SelectItem
                                    key={n}
                                    value={String(n)}
                                    className="text-xs"
                                >
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!prev_page_url}
                    onClick={() => goTo(prev_page_url)}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span
                            key={`dots-${i}`}
                            className="px-1 text-sm text-muted-foreground"
                        >
                            …
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === current_page ? 'default' : 'outline'}
                            size="icon"
                            className="h-7 w-7 text-xs"
                            onClick={() =>
                                router.get(
                                    garden.index(),
                                    { page: p },
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
                    disabled={!next_page_url}
                    onClick={() => goTo(next_page_url)}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

export default function GardenIndex({ gardens, filters }: Props) {
    const { t } = useTranslation(['garden', 'common']);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState(filters.search ?? '');
    const [perPage, setPerPage] = useState(filters.per_page ?? 12);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

    const items = gardens.data;
    const userRole = (g: Garden) =>
        g.members.find((m) => m.role === 'OWNER')?.role;

    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
                router.get(
                    garden.index(),
                    { search: value, per_page: perPage, page: 1 },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }, 400);
        },
        [perPage],
    );

    const handlePerPage = useCallback(
        (value: string) => {
            const n = Number(value);
            setPerPage(n);
            router.get(
                garden.index(),
                { search, per_page: n, page: 1 },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [search],
    );

    return (
        <>
            <Head title={t('garden:index.title')} />

            <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-4">
                    <div>
                        <h1 className="text-base font-semibold tracking-tight">
                            {t('garden:index.title')}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {t('garden:index.totalGardens', {
                                count: gardens.total,
                            })}
                        </p>
                    </div>
                    <Button asChild size="sm" className="gap-1.5">
                        <Link href={garden.create()}>
                            <Plus className="h-3.5 w-3.5" />{' '}
                            {t('garden:index.newGarden')}
                        </Link>
                    </Button>
                </div>

                <div className="flex shrink-0 items-center gap-3 border-b bg-background/80 px-6 py-2.5 backdrop-blur">
                    <div className="relative max-w-sm flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('garden:index.searchPlaceholder')}
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="h-8 pl-8 text-sm"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-0.5 rounded-md border bg-muted/50 p-0.5">
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-7 w-7',
                                            view === 'grid' &&
                                                'bg-background shadow-sm',
                                        )}
                                        onClick={() => setView('grid')}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('garden:index.gridView')}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-7 w-7',
                                            view === 'list' &&
                                                'bg-background shadow-sm',
                                        )}
                                        onClick={() => setView('list')}
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('garden:index.listView')}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted/50">
                                <Leaf
                                    className="h-7 w-7 text-muted-foreground/30"
                                    strokeWidth={1.25}
                                />
                            </div>
                            <p className="text-sm font-medium">
                                {search
                                    ? t('garden:index.noSearchResults')
                                    : t('garden:index.noGardens')}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {search
                                    ? t('garden:index.noSearchResultsDesc')
                                    : t('garden:index.noGardensDesc')}
                            </p>
                            {!search && (
                                <Button
                                    asChild
                                    size="sm"
                                    className="mt-5 gap-1.5"
                                >
                                    <Link href={garden.create()}>
                                        <Plus className="h-3.5 w-3.5" />{' '}
                                        {t('garden:index.newGarden')}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : view === 'grid' ? (
                        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {items.map((g) => (
                                <GardenCard
                                    key={g.id}
                                    g={g}
                                    userRole={userRole(g)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div>
                            <div className="hidden items-center gap-4 border-b bg-muted/30 px-6 py-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase md:flex">
                                <div className="w-10 shrink-0" />
                                <div className="flex-1">
                                    {t('garden:index.columns.name')}
                                </div>
                                <div className="w-40">
                                    {t('garden:index.columns.location')}
                                </div>
                                <div className="w-24 text-right">
                                    {t('garden:index.columns.area')}
                                </div>
                                <div className="w-16 text-center">
                                    {t('garden:index.columns.members')}
                                </div>
                                <div className="hidden w-20 lg:block">
                                    {t('garden:index.columns.role')}
                                </div>
                                <div className="hidden w-28 xl:block">
                                    {t('garden:index.columns.created')}
                                </div>
                                <div className="w-7" />
                            </div>
                            {items.map((g) => (
                                <GardenRow
                                    key={g.id}
                                    g={g}
                                    userRole={userRole(g)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {(gardens.last_page > 1 || gardens.total > 10) && (
                    <Pagination
                        paginator={gardens}
                        perPage={perPage}
                        onPerPageChange={handlePerPage}
                    />
                )}
            </div>
        </>
    );
}
