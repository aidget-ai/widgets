# 微博热搜

## 用途

显示微博实时热搜前 10 条。组件加载后立即请求一次，此后每 20 分钟刷新；点击条目会用系统默认浏览器打开微博搜索结果。

## 数据与权限

- 必须保留 `script` 权限。
- `network` 必须包含 `https://weibo.com` 与 `https://s.weibo.com`。
- 接口为 `https://weibo.com/ajax/side/hotSearch`，通过宿主 `window.aidget.fetch()` 读取。宿主不会自动注入 `Referer`，脚本必须显式发送 `Referer: https://weibo.com/`；缺少该请求头时接口返回 403。
- 过滤带 `is_ad` 的广告条目，优先显示 `label_name` 或 `small_icon_desc`，没有标签时显示压缩后的热度数字。
- 标题必须通过 `textContent` 渲染，不能注入 HTML。

## 可改区域

- `hot-list` 是脚本管理的榜单容器，不应手工 patch；刷新后会整体重建。
- 可修改标题、副标题、平台色变量和页脚文案，但不要破坏 10 行紧凑网格。

## 布局

- 固定尺寸为 360×340；页面声明 `aidget-surface=none` 并自行绘制完整卡面。
- 保留 `.rank-list` 的 10 行网格；标签与热度数字共用右侧指标位。
- 行本身使用 `<button>`，保持键盘焦点、鼠标点击和 Aidget 拖拽边界。

## 刷新与失败

- 不做自动重试；首轮失败显示完整错误态，已有数据时保留旧行并在页脚显示“更新失败”和错误摘要。
- 成功刷新后更新页脚时间；异步初始化结束后调用 `window.aidget.ready()`。
