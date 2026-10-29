# 知乎热榜

## 用途

显示知乎热榜前 10 条。组件加载后立即请求一次，此后每 20 分钟刷新；点击条目会用系统默认浏览器打开对应知乎问题。

## 数据与权限

- 必须保留 `script` 权限。
- `network` 必须包含 `https://api.zhihu.com` 与 `https://www.zhihu.com`。
- 接口为 `https://api.zhihu.com/topstory/hot-list?limit=30`，通过宿主 `window.aidget.fetch()` 读取。
- 仅使用问题 URL 中的数字 id、标题和 `detail_text`；不要用 JavaScript `Number` 处理超出安全整数范围的问题 id。标题必须通过 `textContent` 渲染，不能注入 HTML。

## 可改区域

- `hot-list` 是脚本管理的榜单容器，不应手工 patch；刷新后会整体重建。
- 可修改标题、副标题、平台色变量和页脚文案，但不要把窗口高度压到无法容纳 10 行。

## 布局

- 固定尺寸为 360×340；页面声明 `aidget-surface=none` 并自行绘制完整卡面。
- 保留 `.rank-list` 的 10 行网格和紧凑行高；不要为单条内容增加固定高度。
- 行本身使用 `<button>`，保持键盘焦点、鼠标点击和 Aidget 拖拽边界。
- 使用 `text-overflow: ellipsis` 处理长标题，禁止横向滚动。

## 刷新与失败

- 不做自动重试；首轮失败显示完整错误态，已有数据时保留旧行并在页脚显示“更新失败”和错误摘要。
- 成功刷新后更新页脚时间；异步初始化结束后调用 `window.aidget.ready()`。
