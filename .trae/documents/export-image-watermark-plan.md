# 导出图片水印功能实现计划

## 需求
- 会员用户导出图片时不带水印
- 非会员用户导出图片时带水印，水印文字为 "goalify"

## 实现步骤

### 1. 修改 `GanttExportImage.tsx` 组件
- 添加 `isMember` prop (boolean 类型)
- 在组件内部渲染时，判断是否为会员
- 如果不是会员，在整个图片上添加 "goalify" 水印
- 水印样式：**斜向重复排列的水印**（45度角倾斜）
  - 水印文字半透明（opacity 0.15-0.2）
  - 文字间隔均匀分布，覆盖整个图片区域
  - 水印字号适中，确保可读但不遮挡内容
  - 使用 CSS `transform: rotate()` 实现斜向排列

### 2. 修改 `GanttPage.tsx`
- 从 `useMembershipStore` 获取 `isMember` 状态
- 将 `isMember` 传递给 `GanttExportImage` 组件

### 3. 涉及文件
- [GanttExportImage.tsx](file:///Users/wangyabin/Documents/code/goalify/packages/web/src/components/GanttExportImage.tsx)
- [GanttPage.tsx](file:///Users/wangyabin/Documents/code/goalify/packages/web/src/pages/GanttPage.tsx#L1018-L1044) (GanttExportImage 使用处)
