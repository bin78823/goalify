export interface Tab {
  id: string;              // 唯一标识符
  type: 'home' | 'project'; // 标签类型
  title: string;           // 显示标题
  path: string;            // 路由路径
  projectId?: string;      // 项目ID (仅项目标签有)
  closable: boolean;       // 是否可关闭
  createdAt: number;       // 创建时间戳 (用于排序)
}
