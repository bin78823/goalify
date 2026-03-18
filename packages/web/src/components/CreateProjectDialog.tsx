import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@goalify/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@goalify/ui';
import { Input } from '@goalify/ui';
import { Label } from '@goalify/ui';
import { DatePicker } from '@goalify/ui';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  isOpen,
  onOpenChange,
  onCreate,
}) => {
  const { t, i18n } = useTranslation();
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const handleCreate = () => {
    onCreate(newProject);
    setNewProject({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] hover:opacity-90 text-white shadow-lg shadow-blue-500/20 rounded-xl font-bold px-4 h-10 border-none">
          + {t('project.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] rounded-[32px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{t('project.create')}</DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">{t('project.createFirst')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="font-bold ml-1">{t('project.name')}</Label>
            <Input
              id="name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="My Project"
              className="bg-[var(--secondary)] border-[var(--border)] rounded-xl h-12 px-4 focus:ring-2 focus:ring-[var(--vibrant-blue)]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="font-bold ml-1">{t('project.description')}</Label>
            <Input
              id="description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Project description"
              className="bg-[var(--secondary)] border-[var(--border)] rounded-xl h-12 px-4 focus:ring-2 focus:ring-[var(--vibrant-blue)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate" className="font-bold ml-1">{t('project.startDate')}</Label>
              <DatePicker
                value={newProject.startDate}
                locale={i18n.language}
                onChange={(date) => date && setNewProject({ ...newProject, startDate: date })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate" className="font-bold ml-1">{t('project.endDate')}</Label>
              <DatePicker
                value={newProject.endDate}
                locale={i18n.language}
                onChange={(date) => date && setNewProject({ ...newProject, endDate: date })}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold border-[var(--border)]">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} className="bg-[var(--vibrant-blue)] hover:bg-[var(--vibrant-blue)]/90 text-white font-bold rounded-xl h-12 px-8 shadow-md">
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
