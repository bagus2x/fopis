import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export default function AppLogoIcon({ className }: ComponentProps<'img'>) {
    return <img src="/fopis.png" className={cn('h-10', className)} />;
}
