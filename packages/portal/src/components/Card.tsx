import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ className, hover = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-[var(--card)] rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm transition-all duration-500',
        hover && 'hover:shadow-2xl hover:shadow-blue-500/10 hover:border-[var(--primary)]/30 hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
