<!-- prettier-ignore -->
<div align="center">

# Aidget Community Widgets

**Aidget 社区组件库**

[![检查](https://img.shields.io/github/actions/workflow/status/aidget-ai/widgets/check.yml?branch=main&label=Check&style=flat-square)](https://github.com/aidget-ai/widgets/actions/workflows/check.yml)
[![发布](https://img.shields.io/github/actions/workflow/status/aidget-ai/widgets/publish.yml?branch=main&label=Publish&style=flat-square)](https://github.com/aidget-ai/widgets/actions/workflows/publish.yml)
[![Node 24](https://img.shields.io/badge/Node.js-24-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm 12](https://img.shields.io/badge/pnpm-12-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-111111?style=flat-square)](LICENSE)

[安装社区组件](#安装社区组件) | [开发](#开发)| [组件约定](#组件约定)<br>
[English](README.md) | 简体中文

</div>

本仓库托管 Aidget 使用的社区组件，不包含 Aidget 桌面应用本身。每个组件都是一个可直接发布的 npm 包，包含 HTML、CSS、静态资源和组件元数据。

## 安装社区组件

### 通过 App

进入 Aidget App 的 **社区组件** 面板查看并安装组件。

### 通过 CLI

```sh
aidget community list
aidget community install @aidget-community/welcome
```

## 开发

> Coding Agent 可以使用 `skills/create-aidget-widget` 技能帮助开发 Aidget 组件。

### 创建组件

从欢迎卡片开始，可以少写一层样板：

```sh
git clone https://github.com/aidget-ai/widgets.git && cd widgets
cp -R packages/welcome packages/<id>
```

然后完成以下内容：

1. 将 npm 包命名为 `@aidget-community/<id>`，版本使用精确 semver。
2. 在 `config.json` 中设置唯一的组件 ID、标题、支持平台、初始尺寸和所需能力。
3. 编写静态 HTML/CSS，把脚本、图片、字体等运行时资源放进 `assets/`。
4. 在 `agents.md` 中写明用途、更新约束、刷新方式和外观注意事项；这份文件会随组件分发给 Agent。
5. 在 Aidget 中实际渲染，截取 PNG、JPEG 或 WebP 截图，并只记录验证过的平台。
6. 运行[本地检查](#本地检查)，提交 Pull request。

> 组件 ID 必须匹配 `[a-z0-9][a-z0-9-]{0,63}`，并与包名中的作用域名称一致，初始尺寸不得小于 `160 × 120`。

### 本地检查

建议使用 Node.js 24 和 pnpm。安装依赖后运行完整检查：

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm ready
```

### 分发流程

每个组件都作为作用域 npm 包 `@aidget-community/<id>` 发布。Aidget 会根据包中 `config.json` 声明的平台、权限和网络来源决定是否允许安装。

组件合并到 `main` 后会出现在 Aidget 的社区组件目录中。发布内容发生变化时，应提升 semver 版本并提交新版本；同名同版本对应固定内容，不能在后续修改中复用。

## 组件约定

一个发布包采用以下结构：

```text
packages/<id>/
├── package.json          # npm 元数据和发布文件列表
├── config.json           # Aidget 组件元数据
├── index.html            # 组件入口
├── style.css             # 主样式表
├── agents.md             # 随包分发的 Agent 使用说明
└── assets/               # 截图及所有运行时资源
```

### package.json

包名必须是 `@aidget-community/<id>`，版本使用精确 semver，并填写描述、作者、仓库和许可证。`files` 应包含组件运行所需的全部文件。

> 组件按原样安装，因此不要声明构建脚本、生命周期脚本、依赖安装或 `dependencies`、`optionalDependencies`、`peerDependencies`。

### config.json

下面是一个不申请脚本、位置、存储或网络能力的组件配置：

```json
{
  "id": "note",
  "title": "便签",
  "logo": null,
  "screenshots": ["assets/screenshot.png"],
  "platforms": ["macos", "windows", "linux"],
  "size": { "width": 360, "height": 220 },
  "dragMode": "all",
  "permissions": [],
  "network": []
}
```

- `screenshots` 至少包含一张图片，展示 Aidget 中的实际渲染结果；`logo` 可选。图片必须是 PNG、JPEG 或 WebP，单文件不超过 5 MiB。
- `platforms` 只应列出已经实际验证过的操作系统。初始尺寸不得小于 `160 × 120`。
- `dragMode` 支持两种值：
  - `all`：可拖动普通组件内容，由宿主排除交互区域。
  - `handle`：只允许拖动宿主顶部的拖拽区域。
- `permissions` 只接受 `script`、`location`、`storage`。组件不会自动获得宿主能力，必须在 `config.json` 中明确声明。
- `network` 中的每一项都必须是只包含 origin 的 HTTPS URL，例如 `https://api.example.com`。不允许 HTTP、通配符、路径、查询参数、片段或 URL 凭据。

### 静态资源

- 不得使用符号链接，资源不能逃逸组件目录。
- 运行时引用必须使用相对路径；外部资源只能来自 `config.json` 中声明的精确 HTTPS origin。
- 不接受 `iframe`、`object`、`embed` 或 `base` 元素。
- 使用 `<script>` 时必须声明 `script` 权限。
- 脚本及模块预加载必须引用包内文件；网络授权不允许远程 JavaScript。内联 `<script>` 由宿主根据响应内容生成 CSP 哈希。
- 不接受内联事件属性或 `javascript:` URL；使用 `addEventListener`。运行时 CSP 同时禁止 `eval`、`new Function` 及新增的内联脚本内容。
- npm 包最多 1,000 个文件、20 MiB tarball 和 100 MiB 解压大小。

## 许可证

[MIT 开源许可证](LICENSE)
