import { LanguageSwitcher } from '@/components/language-switcher';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { dashboard, login } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    CheckCircle2,
    FileText,
    Leaf,
    Menu,
    Smartphone,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Welcome() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t } = useTranslation(['welcome', 'common']);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Fopis" />
            <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <img src="/fopis.png" className="h-10" alt="Fopis" />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden items-center gap-8 md:flex">
                        <a
                            href="#features"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            {t('common:nav.features')}
                        </a>
                        <a
                            href="#pricing"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            {t('common:nav.pricing')}
                        </a>
                        <a
                            href="#testimonials"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            {t('common:nav.testimonials')}
                        </a>
                        <a
                            href="#faq"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            {t('common:nav.faq')}
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Desktop Buttons */}
                    <div className="hidden items-center gap-3 md:flex">
                        <LanguageSwitcher />
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={login()}>{t('common:nav.login')}</Link>
                        </Button>
                        <Button size="sm">
                            <Link href={dashboard()}>
                                {t('common:nav.getStarted')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
                        <div className="container mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
                            <a
                                href="#features"
                                className="text-sm hover:text-primary"
                            >
                                {t('common:nav.features')}
                            </a>
                            <a
                                href="#pricing"
                                className="text-sm hover:text-primary"
                            >
                                {t('common:nav.pricing')}
                            </a>
                            <a
                                href="#testimonials"
                                className="text-sm hover:text-primary"
                            >
                                {t('common:nav.testimonials')}
                            </a>
                            <a
                                href="#faq"
                                className="text-sm hover:text-primary"
                            >
                                {t('common:nav.faq')}
                            </a>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {t('common:language.select')}
                                </span>
                                <LanguageSwitcher />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={login()}>
                                    {t('common:nav.login')}
                                </Link>
                            </Button>
                            <Button size="sm" className="w-full" asChild>
                                <Link href={dashboard()}>
                                    {t('common:nav.getStarted')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-background via-background to-muted/30 px-4 py-24">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid items-center gap-12 md:grid-cols-2">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h1 className="text-4xl leading-tight font-bold text-balance md:text-5xl lg:text-6xl">
                                    {t('welcome:hero.title')}
                                </h1>
                                <p className="max-w-lg text-lg text-muted-foreground">
                                    {t('welcome:hero.subtitle')}
                                </p>
                            </div>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button size="lg" className="gap-2">
                                    {t('welcome:hero.startTrial')}{' '}
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button size="lg" variant="outline">
                                    {t('welcome:hero.viewPricing')}
                                </Button>
                            </div>
                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex -space-x-2">
                                    {[...Array(3)].map((_, i) => (
                                        <Avatar
                                            key={i}
                                            className="h-10 w-10 border-2 border-background"
                                        >
                                            <AvatarImage
                                                src={`https://i.pravatar.cc/40?img=${i}`}
                                            />
                                            <AvatarFallback>
                                                U{i}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('welcome:hero.trustedBy')}
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <Card className="overflow-hidden border-2 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    3,847
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {t(
                                                        'welcome:stats.plantsTracked',
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    12
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {t(
                                                        'welcome:stats.gardensActive',
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    92%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {t(
                                                        'welcome:stats.growthRate',
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    24h
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {t(
                                                        'welcome:stats.supportResponse',
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="px-4 py-24">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-16 space-y-4 text-center">
                        <Badge variant="secondary" className="mx-auto">
                            {t('welcome:features.title')}
                        </Badge>
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            {t('welcome:features.subtitle')}
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('welcome:features.description')}
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, idx) => (
                            <Card
                                key={idx}
                                className="transition-colors hover:border-primary/50"
                            >
                                <CardHeader>
                                    <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                    <CardTitle className="text-xl">
                                        {t(
                                            `welcome:features.${feature.key}.title`,
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {t(
                                            `welcome:features.${feature.key}.description`,
                                        )}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-muted/30 px-4 py-24">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-16 space-y-4 text-center">
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            {t('welcome:howItWorks.title')}
                        </h2>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {[1, 2, 3].map((num) => (
                            <Card key={num} className="border-border/50">
                                <CardContent className="pt-8">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                                            {num}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">
                                                {t(
                                                    `welcome:howItWorks.step${num}.title`,
                                                )}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    `welcome:howItWorks.step${num}.description`,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="px-4 py-24">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-16 space-y-4 text-center">
                        <Badge variant="secondary" className="mx-auto">
                            {t('welcome:pricing.title')}
                        </Badge>
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            {t('welcome:pricing.subtitle')}
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('welcome:pricing.description')}
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {pricingPlans.map((plan, idx) => (
                            <Card
                                key={idx}
                                className={`relative flex flex-col ${
                                    plan.isPopular
                                        ? 'border-2 border-primary/50 shadow-lg md:scale-105'
                                        : 'border-border'
                                }`}
                            >
                                {plan.isPopular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        {t('welcome:pricing.mostPopular')}
                                    </Badge>
                                )}
                                <CardHeader>
                                    <CardTitle>
                                        {t(
                                            `welcome:pricing.plans.${plan.key}.name`,
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {t(
                                            `welcome:pricing.plans.${plan.key}.description`,
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-6">
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">
                                                {plan.price === 'Custom'
                                                    ? t(
                                                          `welcome:pricing.plans.${plan.key}.price`,
                                                      )
                                                    : `Rp${plan.price}`}
                                            </span>
                                            {plan.price !== 'Custom' && (
                                                <span className="text-muted-foreground">
                                                    /{t('common:month')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {plan.featureKeys.map(
                                            (featureKey, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                    <span>
                                                        {t(
                                                            `welcome:pricing.plans.${plan.key}.features.${featureKey}`,
                                                        )}
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </CardContent>
                                <div className="p-6 pt-0">
                                    <Button
                                        className="w-full"
                                        variant={
                                            plan.isPopular
                                                ? 'default'
                                                : 'outline'
                                        }
                                    >
                                        {t(
                                            `welcome:pricing.plans.${plan.key}.cta`,
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="bg-muted/30 px-4 py-24">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-16 space-y-4 text-center">
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            {t('welcome:testimonials.title')}
                        </h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[1, 2, 3].map((num) => (
                            <Card key={num} className="border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage
                                                src={`https://i.pravatar.cc/100?img=${num * 3}`}
                                            />
                                            <AvatarFallback>
                                                {t(
                                                    `welcome:testimonials.testimonial${num}.name`,
                                                )
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {t(
                                                    `welcome:testimonials.testimonial${num}.name`,
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    `welcome:testimonials.testimonial${num}.role`,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground italic">
                                        "
                                        {t(
                                            `welcome:testimonials.testimonial${num}.quote`,
                                        )}
                                        "
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="px-4 py-24">
                <div className="container mx-auto max-w-2xl max-w-6xl">
                    <div className="mb-16 space-y-4 text-center">
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            {t('welcome:faq.title')}
                        </h2>
                    </div>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-4"
                    >
                        {[1, 2, 3, 4, 5].map((num) => (
                            <AccordionItem
                                key={num}
                                value={`item-${num}`}
                                className="rounded-lg border border-border px-6"
                            >
                                <AccordionTrigger className="py-4 hover:text-primary hover:no-underline">
                                    <span className="text-left font-semibold">
                                        {t(`welcome:faq.q${num}.question`)}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-muted-foreground">
                                    {t(`welcome:faq.q${num}.answer`)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-b from-background to-muted/30 px-4 py-24">
                <div className="container mx-auto max-w-6xl space-y-8 text-center">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-balance md:text-5xl">
                            {t('welcome:cta.title')}
                        </h2>
                        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                            {t('welcome:cta.subtitle')}
                        </p>
                    </div>
                    <Button size="lg" className="gap-2">
                        {t('welcome:cta.button')} <Zap className="h-4 w-4" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border bg-background">
                <div className="container mx-auto max-w-6xl px-4 py-16">
                    <div className="mb-8 grid gap-8 md:grid-cols-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Leaf className="h-5 w-5 text-primary" />
                                <span className="font-bold">Fopis</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('common:footer.description')}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold">
                                {t('common:footer.product')}
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:nav.features')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:nav.pricing')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.security')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold">
                                {t('common:footer.company')}
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.about')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.blog')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.contact')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold">
                                {t('common:footer.legal')}
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.privacy')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.terms')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        {t('common:footer.cookies')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <Separator className="my-8" />
                    <div className="flex flex-col items-center justify-between text-sm text-muted-foreground md:flex-row">
                        <p>
                            &copy; 2024 Fopis.{' '}
                            {t('common:footer.allRightsReserved')}
                        </p>
                        <div className="mt-4 flex gap-4 md:mt-0">
                            <a href="#" className="hover:text-foreground">
                                Twitter
                            </a>
                            <a href="#" className="hover:text-foreground">
                                LinkedIn
                            </a>
                            <a href="#" className="hover:text-foreground">
                                Facebook
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const features = [
    {
        key: 'multiGarden',
        icon: Leaf,
    },
    {
        key: 'plantTracking',
        icon: BarChart3,
    },
    {
        key: 'growthLogs',
        icon: FileText,
    },
    {
        key: 'analytics',
        icon: Zap,
    },
    {
        key: 'mobile',
        icon: Smartphone,
    },
    {
        key: 'export',
        icon: FileText,
    },
];

// Update pricing plans with keys for i18n
const pricingPlans = [
    {
        key: 'starter',
        price: '0',
        isPopular: false,
        featureKeys: ['garden', 'plants', 'tracking', 'support'],
    },
    {
        key: 'grower',
        price: '40.000',
        isPopular: false,
        featureKeys: ['gardens', 'plants', 'tracking', 'analytics', 'support'],
    },
    {
        key: 'professional',
        price: '80.000',
        isPopular: true,
        featureKeys: ['gardens', 'plants', 'analytics', 'export', 'support'],
    },
    {
        key: 'enterprise',
        price: 'Custom',
        isPopular: false,
        featureKeys: ['gardens', 'plants', 'integrations', 'support', 'sla'],
    },
];
