# 甘特图任务管理工具规格说明

## Why
用户需要一个跨平台的任务管理工具，通过甘特图可视化方式帮助团队和个人管理项目进度，提高任务规划和追踪的效率。

## What Changes
- 创建一个基于 Tauri 的桌面应用程序
- 采用 monorepo 架构，包含基础 UI 库、Web 端和 Desktop 端
- 使用现代前端技术栈
- 支持多语言国际化

## Impact
- 这是一个全新项目，无影响范围
- 需要建立完整的项目架构和开发流程

---

## ADDED Requirements

### Requirement: 项目架构
系统 SHALL 采用 monorepo 架构组织代码，包含以下包：
- `@goalify/ui`: 基础 UI 组件库
- `@goalify/web`: Web 应用程序
- `@goalify/desktop`: Tauri 桌面应用程序

#### Scenario: Monorepo 项目初始化
- **WHEN** 开发者克隆仓库并安装依赖
- **THEN** 所有包应能正常安装并相互引用

### Requirement: 基础 UI 库
系统 SHALL 提供可复用的 UI 组件库，包含：
- 基础组件（按钮、输入框、模态框等）
- 甘特图专用组件（时间轴、任务条、里程碑等）
- 通用布局组件

#### Scenario: UI 组件使用
- **WHEN** 开发者在业务代码中导入 UI 组件
- **THEN** 组件应能正常渲染并响应交互

### Requirement: 甘特图核心功能
系统 SHALL 提供完整的甘特图功能：
- 任务创建、编辑、删除
- 任务时间范围设置（开始日期、结束日期）
- 任务依赖关系管理
- 任务进度追踪
- 里程碑设置

#### Scenario: 创建任务
- **WHEN** 用户点击"添加任务"按钮并填写任务信息
- **THEN** 任务应出现在甘特图时间轴上

#### Scenario: 调整任务时间
- **WHEN** 用户拖拽任务条调整时间范围
- **THEN** 任务的开始和结束日期应相应更新

### Requirement: 项目管理
系统 SHALL 支持多项目管理：
- 创建、编辑、删除项目
- 项目成员管理
- 项目级时间线视图

### Requirement: 国际化支持
系统 SHALL 支持多语言切换：
- 支持简体中文、繁体中文、英文
- 语言切换不应影响用户体验
- 所有 UI 文本应可翻译

#### Scenario: 语言切换
- **WHEN** 用户在设置中选择不同语言
- **THEN** 整个应用的 UI 文本应切换到对应语言

### Requirement: 数据持久化
系统 SHALL 支持任务数据的本地存储：
- 使用 Tauri 文件系统 API 进行数据存储
- 支持数据导入导出（JSON 格式）

### Requirement: 桌面端特性
系统 SHALL 提供桌面端特有功能：
- 窗口管理（最小化、最大化、关闭）
- 系统托盘支持
- 原生菜单栏

---

## 技术栈选型

### 核心框架
- **前端框架**: React 19 + TypeScript
- **桌面框架**: Tauri 2.x
- **构建工具**: Vite 8.x
- **包管理**: pnpm

### UI 库
- **样式方案**: Tailwind CSS 4.x
- **UI 组件**: Radix UI Primitives
- **图标**: Lucide React

### 甘特图
- **Gantt 库**: 自研

### 国际化
- **i18n 方案**: react-i18next

### 状态管理
- **状态管理**: Zustand

### 代码质量
- **代码规范**: ESLint + Prettier
- **提交规范**: Husky + Commitlint
