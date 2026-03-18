import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@goalify/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@goalify/ui';
import { Input } from '@goalify/ui';
import { Label } from '@goalify/ui';
import { DatePicker } from '@goalify/ui';
import type { Project } from '../contexts/GanttContext';

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSave: (updates: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  isOpen,
  onOpenChange,
  project,
  onSave,
}) => {
  const { t, i18n } = useTranslation();
  const [editedProject, setEditedProject] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
  });

  useEffect(() => {
    if (project) {
      setEditedProject({
        name: project.name,
        description: project.description,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
      });
    }
  }, [project, isOpen]);

  const handleSave = () => {
    onSave(editedProject);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] rounded-[32px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{t('project.edit')}</DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">
            {t('project.editDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="edit-name" className="font-bold ml-1">
              {t('project.name')}
            </Label>
            <Input
              id="edit-name"
              value={editedProject.name}
              onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
              placeholder="My Project"
              className="bg-[var(--secondary)] border-[var(--border)] rounded-xl h-12 px-4 focus:ring-2 focus:ring-[var(--vibrant-blue)]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description" className="font-bold ml-1">
              {t('project.description')}
            </Label>
            <Input
              id="edit-description"
              value={editedProject.description}
              onChange={(e) =>
                setEditedProject({ ...editedProject, description: e.target.value })
              }
              placeholder="Project description"
              className="bg-[var(--secondary)] border-[var(--border)] rounded-xl h-12 px-4 focus:ring-2 focus:ring-[var(--vibrant-blue)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-startDate" className="font-bold ml-1">
                {t('project.startDate')}
              </Label>
              <DatePicker
                value={editedProject.startDate}
                locale={i18n.language}
                onChange={(date) =>
                  date && setEditedProject({ ...editedProject, startDate: date })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-endDate" className="font-bold ml-1">
                {t('project.endDate')}
              </Label>
              <DatePicker
                value={editedProject.endDate}
                locale={i18n.language}
                onChange={(date) =>
                  date && setEditedProject({ ...editedProject, endDate: date })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-12 font-bold border-[var(--border)]"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[var(--vibrant-blue)] hover:bg-[var(--vibrant-blue)]/90 text-white font-bold rounded-xl h-12 px-8 shadow-md"
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
