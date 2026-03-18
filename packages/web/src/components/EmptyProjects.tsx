import { useTranslation } from 'react-i18next';
import { FolderKanban, ChevronRight } from 'lucide-react';
import { Button } from '@goalify/ui';

interface EmptyProjectsProps {
  onCreateClick: () => void;
}

const EmptyProjects: React.FC<EmptyProjectsProps> = ({ onCreateClick }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm animate-float">
      <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mb-4">
        <FolderKanban className="h-8 w-8 text-[var(--muted-foreground)] opacity-30" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)]">{t('project.noProjects')}</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('project.createFirst')}</p>
      <Button 
        variant="ghost" 
        className="mt-6 text-[var(--vibrant-blue)] font-bold hover:bg-[var(--vibrant-blue)]/10"
        onClick={onCreateClick}
      >
        {t('project.createFirst')} <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

export default EmptyProjects;
