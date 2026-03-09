import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    CheckCircle2,
    CreditCard,
    Leaf,
    Lock,
    ShieldCheck,
    Sparkles,
    Zap,
    Building2,
    ArrowLeft,
    BadgeCheck,
    Clock,
    Banknote,
} from 'lucide-react';
import payment from '@/routes/payment';

// ── Types ────────────────────────────────────────────────────────────────────

interface Plan {
    key: string;
    price: string;
    period: string;
    isPopular: boolean;
    features: string[];
    icon: React.ElementType;
    color: string;
}

interface PaymentPageProps {
    selectedPlan?: string;
    user?: {
        name: string;
        email: string;
    };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const plans: Plan[] = [
    {
        key: 'grower',
        price: '40.000',
        period: '/bulan',
        isPopular: false,
        features: [
            '5 kebun',
            '50 tanaman',
            'Pelacakan pertumbuhan',
            'Analitik dasar',
            'Dukungan email',
        ],
        icon: Leaf,
        color: 'text-emerald-500',
    },
    {
        key: 'professional',
        price: '80.000',
        period: '/bulan',
        isPopular: true,
        features: [
            'Kebun tak terbatas',
            '200 tanaman',
            'Analitik lanjutan',
            'Ekspor data',
            'Dukungan prioritas',
        ],
        icon: Sparkles,
        color: 'text-primary',
    },
    {
        key: 'enterprise',
        price: 'Custom',
        period: '',
        isPopular: false,
        features: [
            'Semua fitur Pro',
            'Integrasi API',
            'Manajer akun',
            'SLA 99.9%',
            'Onboarding khusus',
        ],
        icon: Building2,
        color: 'text-violet-500',
    },
];

const paymentMethods = [
    { id: 'credit_card', label: 'Kartu Kredit / Debit', icon: CreditCard },
    { id: 'bank_transfer', label: 'Transfer Bank', icon: Banknote },
    { id: 'virtual_account', label: 'Virtual Account', icon: Building2 },
];

const bankOptions = [
    { id: 'bca', label: 'BCA', logo: 'BCA' },
    { id: 'mandiri', label: 'Mandiri', logo: 'MND' },
    { id: 'bni', label: 'BNI', logo: 'BNI' },
    { id: 'bri', label: 'BRI', logo: 'BRI' },
];

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pembayaran', href: payment.index() },
];

// ── Layout ────────────────────────────────────────────────────────────────────

Payment.layout = (page: ReactNode) => (
    <AppLayout children={page} breadcrumbs={breadcrumbs} />
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function Payment({
    selectedPlan = 'professional',
    user,
}: PaymentPageProps) {
    const { t } = useTranslation(['payment', 'common']);

    const [activePlan, setActivePlan] = useState<string>(selectedPlan);
    const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
    const [selectedBank, setSelectedBank] = useState<string>('bca');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
        'monthly',
    );
    const [isProcessing, setIsProcessing] = useState(false);

    const currentPlan = plans.find((p) => p.key === activePlan) ?? plans[1];
    const isEnterprise = activePlan === 'enterprise';

    const basePrice =
        currentPlan.price === 'Custom'
            ? 0
            : parseInt(currentPlan.price.replace('.', ''), 10);

    const displayPrice =
        billingCycle === 'yearly' && basePrice > 0
            ? ((basePrice * 12 * 0.8) / 12).toLocaleString('id-ID')
            : currentPlan.price;

    const yearlyTotal =
        billingCycle === 'yearly' && basePrice > 0
            ? (basePrice * 12 * 0.8).toLocaleString('id-ID')
            : null;

    function handleSubmit() {
        if (isEnterprise) return;
        setIsProcessing(true);
        // Simulate submission — replace with router.post('/payment', {...})
        setTimeout(() => setIsProcessing(false), 2000);
    }

    return (
        <>
            <Head title="Pembayaran — Fopis" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="shrink-0"
                    >
                        <Link href={dashboard()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Upgrade Paket</h1>
                        <p className="text-sm text-muted-foreground">
                            Pilih paket dan selesaikan pembayaran Anda
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                    {/* ── Left Column ── */}
                    <div className="flex flex-col gap-6">
                        {/* Plan Selector */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        Pilih Paket
                                    </CardTitle>

                                    {/* Billing toggle */}
                                    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                                        <button
                                            onClick={() =>
                                                setBillingCycle('monthly')
                                            }
                                            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                                billingCycle === 'monthly'
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Bulanan
                                        </button>
                                        <button
                                            onClick={() =>
                                                setBillingCycle('yearly')
                                            }
                                            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                                billingCycle === 'yearly'
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Tahunan
                                            <Badge
                                                variant="secondary"
                                                className="h-4 rounded-sm px-1 text-[10px]"
                                            >
                                                -20%
                                            </Badge>
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-3">
                                {plans.map((plan) => {
                                    const Icon = plan.icon;
                                    const isActive = activePlan === plan.key;
                                    const priceDisplay =
                                        plan.price === 'Custom'
                                            ? 'Custom'
                                            : billingCycle === 'yearly'
                                              ? Math.floor(
                                                    parseInt(
                                                        plan.price.replace(
                                                            '.',
                                                            '',
                                                        ),
                                                        10,
                                                    ) * 0.8,
                                                ).toLocaleString('id-ID')
                                              : plan.price;

                                    return (
                                        <button
                                            key={plan.key}
                                            onClick={() =>
                                                setActivePlan(plan.key)
                                            }
                                            className={`relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50 ${
                                                isActive
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border bg-background'
                                            }`}
                                        >
                                            {plan.isPopular && (
                                                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px]">
                                                    Terpopuler
                                                </Badge>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <Icon
                                                    className={`h-5 w-5 ${plan.color}`}
                                                />
                                                {isActive && (
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold capitalize">
                                                    {plan.key}
                                                </div>
                                                <div className="mt-0.5 text-sm text-muted-foreground">
                                                    {plan.price === 'Custom' ? (
                                                        <span className="font-medium text-foreground">
                                                            Hubungi kami
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="text-base font-bold text-foreground">
                                                                Rp{' '}
                                                                {priceDisplay}
                                                            </span>
                                                            <span className="text-xs">
                                                                /bln
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Features included */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Yang Anda Dapatkan di Paket{' '}
                                    <span className="text-primary capitalize">
                                        {currentPlan.key}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {currentPlan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        {!isEnterprise && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Metode Pembayaran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {/* Method selector */}
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {paymentMethods.map((method) => {
                                            const Icon = method.icon;
                                            const isActive =
                                                paymentMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    onClick={() =>
                                                        setPaymentMethod(
                                                            method.id,
                                                        )
                                                    }
                                                    className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                                                        isActive
                                                            ? 'border-primary bg-primary/5 text-primary'
                                                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                                    }`}
                                                >
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    {method.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Credit Card Fields */}
                                    {paymentMethod === 'credit_card' && (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Nomor Kartu
                                                </label>
                                                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                                                    <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        placeholder="1234 5678 9012 3456"
                                                        maxLength={19}
                                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Masa Berlaku
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        maxLength={7}
                                                        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        CVV
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        maxLength={4}
                                                        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Nama di Kartu
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="NAMA LENGKAP"
                                                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm uppercase outline-none placeholder:text-muted-foreground/60 placeholder:normal-case focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bank Transfer */}
                                    {paymentMethod === 'bank_transfer' && (
                                        <div className="flex flex-col gap-3">
                                            <p className="text-sm text-muted-foreground">
                                                Pilih bank tujuan transfer:
                                            </p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {bankOptions.map((bank) => (
                                                    <button
                                                        key={bank.id}
                                                        onClick={() =>
                                                            setSelectedBank(
                                                                bank.id,
                                                            )
                                                        }
                                                        className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-xs font-bold transition-all ${
                                                            selectedBank ===
                                                            bank.id
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-border text-muted-foreground hover:border-primary/40'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-black">
                                                            {bank.logo}
                                                        </span>
                                                        {bank.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                                <p className="text-xs text-muted-foreground">
                                                    Setelah konfirmasi, nomor
                                                    rekening tujuan akan dikirim
                                                    ke email Anda. Pembayaran
                                                    diverifikasi dalam 1×24 jam
                                                    kerja.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Virtual Account */}
                                    {paymentMethod === 'virtual_account' && (
                                        <div className="flex flex-col gap-3">
                                            <p className="text-sm text-muted-foreground">
                                                Pilih penyedia Virtual Account:
                                            </p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {bankOptions.map((bank) => (
                                                    <button
                                                        key={bank.id}
                                                        onClick={() =>
                                                            setSelectedBank(
                                                                bank.id,
                                                            )
                                                        }
                                                        className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-xs font-bold transition-all ${
                                                            selectedBank ===
                                                            bank.id
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-border text-muted-foreground hover:border-primary/40'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-black">
                                                            {bank.logo}
                                                        </span>
                                                        {bank.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                                Kode Virtual Account berlaku
                                                selama 24 jam setelah dibuat.
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Enterprise CTA */}
                        {isEnterprise && (
                            <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-800/50 dark:bg-violet-950/20">
                                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                                    <Building2 className="h-12 w-12 text-violet-500" />
                                    <div className="space-y-1">
                                        <h3 className="font-semibold">
                                            Paket Enterprise
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Harga disesuaikan dengan kebutuhan
                                            tim dan organisasi Anda. Tim kami
                                            akan menghubungi Anda dalam 1×24
                                            jam.
                                        </p>
                                    </div>
                                    <Button className="gap-2">
                                        Hubungi Sales
                                        <Zap className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Right Column — Order Summary ── */}
                    <div className="flex flex-col gap-4">
                        <Card className="sticky top-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Ringkasan Pesanan
                                </CardTitle>
                                <CardDescription>
                                    Paket aktif setelah pembayaran dikonfirmasi
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {/* Plan summary */}
                                <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-linear-to-br from-primary/5 to-primary/10 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <currentPlan.icon
                                            className={`h-5 w-5 ${currentPlan.color}`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold capitalize">
                                            {currentPlan.key}
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {billingCycle === 'yearly'
                                                ? 'Tagihan Tahunan'
                                                : 'Tagihan Bulanan'}
                                        </div>
                                    </div>
                                    {!isEnterprise && (
                                        <div className="text-right">
                                            <div className="font-bold">
                                                Rp {displayPrice}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                /bln
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Price breakdown */}
                                {!isEnterprise && (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Harga paket</span>
                                            <span>Rp {displayPrice}/bln</span>
                                        </div>
                                        {billingCycle === 'yearly' && (
                                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                                <span>
                                                    Diskon tahunan (20%)
                                                </span>
                                                <span>
                                                    -Rp{' '}
                                                    {(
                                                        (basePrice * 12 * 0.2) /
                                                        12
                                                    ).toLocaleString('id-ID')}
                                                    /bln
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>PPN (11%)</span>
                                            <span>
                                                Rp{' '}
                                                {Math.floor(
                                                    (billingCycle === 'yearly'
                                                        ? basePrice * 0.8
                                                        : basePrice) * 0.11,
                                                ).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-semibold">
                                            <span>
                                                {billingCycle === 'yearly'
                                                    ? 'Total Hari Ini'
                                                    : 'Total per Bulan'}
                                            </span>
                                            <span>
                                                Rp{' '}
                                                {billingCycle === 'yearly' &&
                                                yearlyTotal
                                                    ? Math.floor(
                                                          basePrice *
                                                              12 *
                                                              0.8 *
                                                              1.11,
                                                      ).toLocaleString('id-ID')
                                                    : Math.floor(
                                                          basePrice * 1.11,
                                                      ).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        {billingCycle === 'yearly' && (
                                            <p className="text-xs text-muted-foreground">
                                                Ditagih setiap tahun. Berikutnya
                                                pada{' '}
                                                {new Date(
                                                    Date.now() +
                                                        365 *
                                                            24 *
                                                            60 *
                                                            60 *
                                                            1000,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* CTA */}
                                {!isEnterprise ? (
                                    <Button
                                        className="w-full gap-2"
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                Bayar Sekarang
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full gap-2"
                                        size="lg"
                                        variant="outline"
                                    >
                                        Hubungi Tim Sales
                                    </Button>
                                )}

                                {/* Trust badges */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        Pembayaran dienkripsi & aman (SSL
                                        256-bit)
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        Batalkan kapan saja, tanpa biaya penalti
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        Akses langsung aktif setelah pembayaran
                                    </div>
                                </div>

                                <Separator />

                                {/* Billing info */}
                                {user && (
                                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                            Tagihan akan dikirim ke
                                        </p>
                                        <p className="text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                )}

                                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                                    Dengan melanjutkan, Anda menyetujui{' '}
                                    <a
                                        href="#"
                                        className="underline hover:text-foreground"
                                    >
                                        Syarat & Ketentuan
                                    </a>{' '}
                                    dan{' '}
                                    <a
                                        href="#"
                                        className="underline hover:text-foreground"
                                    >
                                        Kebijakan Privasi
                                    </a>{' '}
                                    Fopis.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
