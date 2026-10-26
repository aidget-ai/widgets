# sticky-todos · 待办事项

## 用途

桌面便签，展示可勾选事项。勾选状态由宿主按 widget id 持久化，重启 aidget 后恢复。

## 可改区域

- `todos`：任务列表容器。每条 `li` 必须保留唯一的 `data-todo-id`，对应一条 `<label>` 和原生 `<input type="checkbox">`。
- 修改任务后，同步更新标题旁的完成计数总数。

## 存储与权限

- 必须保留 `script` 与 `storage` 权限。
- 浏览器原生 `localStorage` 在 opaque-origin 沙箱中不可用；脚本只使用异步 `window.aidget.storage`。
- 持久化 key 为 `todo-checked-v1`，值是 `data-todo-id -> boolean` 的 JSON 字符串。
- 加载成功后才启用复选框；保存失败时回滚本次勾选，并通过隐藏的 `role=status` 显示“保存失败”。
- 主窗口预览没有宿主桥时会禁用复选框并显示“预览模式”，这是预期行为。
- 异步初始化结束后调用 `window.aidget?.ready?.()`。

## 布局

- 窗口固定为 360×260，页面声明 `aidget-surface=none` 并绘制完整便签表面。
- 顶部 28px 是宿主拖拽区；纸张从 13px 开始，胶带超出纸张上边界且不能被裁剪。
- 纸面由 `.paper` 负责不规则纸边、水彩纹理和阴影；`.note::before` 是半透明胶带。
- 纸张纹理使用 `assets/watercolor-paper-texture.png`；不使用 `backdrop-filter`、横线或点阵背景。
- 任务列表保持单列紧凑排列，与标题间距 18px，底部留 16px。

## 刷新

无定时刷新。状态未恢复时检查 `storage` 权限、宿主存储和底部状态文案。
