export interface Tab {
  id: string; // 唯一标识符
  type: "home" | "project" | "gantt" | "subtask"; // 标签类型
  title: string; // 显示标题
  path?: string; // 路由路径
  projectId?: string; // 项目ID (仅项目标签有)
  taskId?: string; // 任务ID (甘特图和子任务看板有)
  taskColor?: string; // 任务颜色 (子任务看板有)
  closable: boolean; // 是否可关闭
  createdAt: number; // 创建时间戳 (用于排序)
}
