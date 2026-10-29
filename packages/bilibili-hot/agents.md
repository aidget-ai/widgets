# Bilibili 热搜

## 用途

显示 Bilibili 热搜前 10 条。组件加载后立即请求一次，此后每 20 分钟刷新；点击条目会用系统默认浏览器打开 Bilibili 搜索结果。

## 数据与权限

- 必须保留 `script` 权限。
- `network` 必须包含 `https://s.search.bilibili.com` 与 `https://search.bilibili.com`。
- 接口为 `https://s.search.bilibili.com/main/hotword`，通过宿主 `window.aidget.fetch()` 读取。
- 标题来自 `show_name`，搜索词来自 `keyword`；不使用接口中的 HTTP 图标地址。
- 标题必须通过 `textContent` 渲染，不能注入 HTML。

## 可改区域

- `hot-list` 是脚本管理的榜单容器，不应手工 patch；刷新后会整体重建。
- 可修改标题、副标题、平台色变量和页脚文案，但不要破坏 10 行紧凑网格。

## 布局

- 固定尺寸为 360×340；页面声明 `aidget-surface=none` 并自行绘制完整卡面。
- 保留 `.rank-list` 的 10 行网格；热度层级使用 `is-tag` 小标签。
- 行本身使用 `<button>`，保持键盘焦点、鼠标点击和 Aidget 拖拽边界。

## 刷新与失败

- 不做自动重试；首轮失败显示完整错误态，已有数据时保留旧行并在页脚显示“更新失败”和错误摘要。
- 成功刷新后更新页脚时间；异步初始化结束后调用 `window.aidget.ready()`。
