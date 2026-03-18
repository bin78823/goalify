import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderKanban } from 'lucide-react';
import { useGanttStore } from '../contexts/GanttContext';
import ProjectCard from '../components/ProjectCard';
import CreateProjectDialog from '../components/CreateProjectDialog';
import EmptyProjects from '../components/EmptyProjects';

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const { projects, addProject } = useGanttStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateProject = (project: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => {
    addProject({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FolderKanban className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] bg-clip-text text-transparent">
            Goalify
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] bg-clip-text text-transparent tracking-tight">
              {t('project.title')}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {projects.length} {t('project.title').toLowerCase()} active
            </p>
          </div>
          <CreateProjectDialog
            isOpen={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreate={handleCreateProject}
          />
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyProjects onCreateClick={() => setIsCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
