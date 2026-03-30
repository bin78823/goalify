import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary:
      'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700',
    outline:
      'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

export default Button;
