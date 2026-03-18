import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { zhCN, zhTW, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { Calendar } from './Calendar';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Calendar as CalendarIcon } from 'lucide-react';

const localeMap: Record<string, Locale> = {
  en: enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  locale?: string;
}

const DatePicker = React.forwardRef<
  HTMLButtonElement,
  DatePickerProps & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>
>(({ value, onChange, placeholder = 'Select date', className, locale = 'en', ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const dateFnsLocale = localeMap[locale] || enUS;

  const getPlaceholder = () => {
    if (placeholder !== 'Select date') return placeholder;
    switch (locale) {
      case 'zh-CN':
        return '选择日期';
      case 'zh-TW':
        return '選擇日期';
      default:
        return 'Select date';
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen} {...props}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          ref={ref}
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-slate-500')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP', { locale: dateFnsLocale }) : getPlaceholder()}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={8}
          className="z-50 w-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <Calendar
            mode="single"
            selected={value}
            localeCode={locale}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
DatePicker.displayName = 'DatePicker';

export { DatePicker };
