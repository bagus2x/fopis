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

export default function Welcome() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Fopis" />
            <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <img src="/fopis.png" className="h-10" />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden items-center gap-8 md:flex">
                        <a
                            href="#features"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            Features
                        </a>
                        <a
                            href="#pricing"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            Pricing
                        </a>
                        <a
                            href="#testimonials"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            Testimonials
                        </a>
                        <a
                            href="#faq"
                            className="text-sm transition-colors hover:text-primary"
                        >
                            FAQ
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
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={login()}>Login</Link>
                        </Button>
                        <Button size="sm">
                            <Link href={dashboard()}>Get Started</Link>
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
                                Features
                            </a>
                            <a
                                href="#pricing"
                                className="text-sm hover:text-primary"
                            >
                                Pricing
                            </a>
                            <a
                                href="#testimonials"
                                className="text-sm hover:text-primary"
                            >
                                Testimonials
                            </a>
                            <a
                                href="#faq"
                                className="text-sm hover:text-primary"
                            >
                                FAQ
                            </a>
                            <Separator className="my-2" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={login()}>Login</Link>
                            </Button>
                            <Button size="sm" className="w-full" asChild>
                                <Link href={dashboard()}>Get Started</Link>
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
                                    Smart Garden Management for Modern Farmers
                                </h1>
                                <p className="max-w-lg text-lg text-muted-foreground">
                                    Manage your durian, mango, and other crops
                                    in one powerful platform. Track growth,
                                    organize data, and grow smarter.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button size="lg" className="gap-2">
                                    Start Free Trial{' '}
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button size="lg" variant="outline">
                                    View Pricing
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
                                    Trusted by 2,000+ farmers worldwide
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
                                                    Plants Tracked
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    12
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Gardens Active
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    92%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Growth Rate
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-border/50 bg-background p-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    24h
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Support Response
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
                            Why Choose Fopis
                        </Badge>
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            Everything you need to grow smarter
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            Powerful features designed for farmers who want to
                            maximize yields and minimize effort.
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
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {feature.description}
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
                            Get started in 3 simple steps
                        </h2>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {steps.map((step, idx) => (
                            <Card key={idx} className="border-border/50">
                                <CardContent className="pt-8">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {step.description}
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
                            Simple Transparent Pricing
                        </Badge>
                        <h2 className="text-3xl font-bold text-balance md:text-4xl">
                            Plans for every farmer
                        </h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            Choose the perfect plan to grow your operation.
                            Always flexible, always fair.
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
                                        Most Popular
                                    </Badge>
                                )}
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-6">
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">
                                                ${plan.price}
                                            </span>
                                            {plan.price !== 'Custom' && (
                                                <span className="text-muted-foreground">
                                                    /month
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-sm"
                                            >
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
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
                                        {plan.cta}
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
                            Loved by farmers everywhere
                        </h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {testimonials.map((testimonial, idx) => (
                            <Card key={idx} className="border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage
                                                src={`https://i.pravatar.cc/100?img=${idx * 3}`}
                                            />
                                            <AvatarFallback>
                                                {testimonial.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {testimonial.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {testimonial.role}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground italic">
                                        "{testimonial.quote}"
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
                            Frequently asked questions
                        </h2>
                    </div>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-4"
                    >
                        {faqItems.map((item, idx) => (
                            <AccordionItem
                                key={idx}
                                value={`item-${idx}`}
                                className="rounded-lg border border-border px-6"
                            >
                                <AccordionTrigger className="py-4 hover:text-primary hover:no-underline">
                                    <span className="text-left font-semibold">
                                        {item.question}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-muted-foreground">
                                    {item.answer}
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
                            Start Managing Your Garden Smarter Today
                        </h2>
                        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                            Join thousands of farmers already transforming their
                            operations with Fopis.
                        </p>
                    </div>
                    <Button size="lg" className="gap-2">
                        Start Free Trial <Zap className="h-4 w-4" />
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
                                Smart garden management for modern farmers.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Pricing
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Security
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold">Company</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        About
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold">Legal</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Privacy
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Terms
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground"
                                    >
                                        Cookies
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <Separator className="my-8" />
                    <div className="flex flex-col items-center justify-between text-sm text-muted-foreground md:flex-row">
                        <p>&copy; 2024 Fopis. All rights reserved.</p>
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
        icon: Leaf,
        title: 'Multi-Garden Management',
        description:
            'Manage multiple gardens and properties from a single dashboard with ease.',
    },
    {
        icon: BarChart3,
        title: 'Plant Tracking & Monitoring',
        description:
            'Track individual plants and monitor their health, growth stages, and conditions.',
    },
    {
        icon: FileText,
        title: 'Growth & Harvest Logs',
        description:
            'Detailed records of growth stages, harvest dates, and yield information.',
    },
    {
        icon: Zap,
        title: 'Usage Analytics',
        description:
            'Advanced analytics to understand patterns and optimize your farming practices.',
    },
    {
        icon: Smartphone,
        title: 'Mobile Friendly Dashboard',
        description:
            'Access your data anytime, anywhere with our responsive mobile application.',
    },
    {
        icon: FileText,
        title: 'Export & Reports',
        description:
            'Generate detailed reports and export data in multiple formats for analysis.',
    },
];

const steps = [
    {
        title: 'Create Your Garden',
        description:
            'Set up your garden profile with location, size, and crop information in minutes.',
    },
    {
        title: 'Add Plants',
        description:
            'Add durian, mango, avocado, vegetables, and other crops you are growing.',
    },
    {
        title: 'Monitor & Analyze Growth',
        description:
            'Track growth stages, view analytics, and make data-driven decisions.',
    },
];

const pricingPlans = [
    {
        name: 'Starter',
        description: 'For new farmers',
        price: '0',
        features: [
            '1 Garden',
            'Up to 20 Plants per garden',
            'Basic tracking',
            'Community support',
        ],
        cta: 'Get Started',
        isPopular: false,
    },
    {
        name: 'Grower',
        description: 'For growing operations',
        price: '9',
        features: [
            'Up to 3 Gardens',
            '200 Plants per garden',
            'Growth tracking & notes',
            'Basic analytics',
            'Email support',
        ],
        cta: 'Start Free Trial',
        isPopular: false,
    },
    {
        name: 'Professional',
        description: 'For established farms',
        price: '29',
        features: [
            'Up to 10 Gardens',
            '1000 Plants per garden',
            'Advanced analytics',
            'Export reports',
            'Priority support',
        ],
        cta: 'Start Free Trial',
        isPopular: true,
    },
    {
        name: 'Enterprise',
        description: 'For large operations',
        price: 'Custom',
        features: [
            'Unlimited Gardens',
            'Unlimited Plants',
            'Custom integrations',
            'Dedicated support',
            'SLA included',
        ],
        cta: 'Contact Sales',
        isPopular: false,
    },
];

const testimonials = [
    {
        name: 'Budi Hartono',
        role: 'Durian Farmer',
        initials: 'BH',
        quote: 'Fopis helped me increase my durian yield by 40% in just one season. The analytics are incredibly helpful.',
    },
    {
        name: 'Siti Rahman',
        role: 'Plantation Owner',
        initials: 'SR',
        quote: 'Finally, a platform that understands what farmers need. The mobile app is perfect for checking on my gardens.',
    },
    {
        name: 'Ahmad Wijaya',
        role: 'Mixed Crop Farmer',
        initials: 'AW',
        quote: 'Managing 12 different gardens was chaos. Now I have complete visibility and control. Highly recommended!',
    },
];

const faqItems = [
    {
        question: 'Can I upgrade or downgrade my plan anytime?',
        answer: "Yes, you can change your plan at any time. Changes take effect immediately, and we'll prorate any charges or credits.",
    },
    {
        question: 'What happens if I exceed my plant limits?',
        answer: "We'll notify you when you're approaching your limit. You can upgrade your plan to add more gardens and plants, or remove unused entries.",
    },
    {
        question: 'Is there a free trial for paid plans?',
        answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to get started.',
    },
    {
        question: 'Can I export my data?',
        answer: 'Absolutely. You can export your garden data, plant records, and analytics in CSV, PDF, and Excel formats anytime.',
    },
    {
        question: 'Is Fopis mobile friendly?',
        answer: 'Yes, Fopis is fully responsive and works perfectly on smartphones, tablets, and desktops.',
    },
];
