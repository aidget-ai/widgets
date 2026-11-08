# grok-acrylic · Grok · 亚克力挂件

## 用途

展示蓝黑配色的 Grok 猫娘亚克力挂件。角色、科技小图案和 Grok 铭牌合为一张透明
PNG；原照片中的布面、显示器和支架不属于挂件。

## 结构与素材

- `main.stage` 是唯一可替换区域 `stage`。位置和尺寸归用户控制，内容更新不得移动窗口。
- `.pendant-art` 负责显示 `assets/pendant.png`；`.pendant-shine` 用同一 PNG 的透明度作遮罩。
  `.pendant` 按 `--art-ratio` 在窗口内居中，扫光的百分比坐标以这块方形画布为基准，不能
  改回按矩形窗口铺满。
- hover 反光由一枚白色径向柔光与一条斜向玻璃高光带组成，不使用角色主题色；两者都被
  PNG 透明度遮罩限制在图案轮廓内。
- PNG 是包内运行资源，使用相对路径。`assets/screenshot.png` 仅供社区卡片预览。
- 保留猫耳、蓝色发束、终端和星形装饰、完整人物姿势以及底部 Grok 铭牌；四周透明留白
  和透明刀模边缘必须完整，不要裁切或加矩形背景。

## 扫光、权限与刷新

- 内联脚本通过 `window.aidget.onPointer` 接收宿主 hover 事件；`enter` / `move` 更新
  光位并升到全亮，`leave` 回到静止光位。不要改回 DOM `pointermove`，也不要在窗口
  `blur` 时收掉高光，否则非活动窗口会失去跟随效果。
- 扫光动画使用 `window.aidget.requestAnimationFrame`，按经过时间插值；收敛后停止申请帧。
  需要宿主提供该动画 API，不要改用 iframe 的原生帧时钟或增加常驻循环。
- `prefers-reduced-motion` 下直接到达目标。不要增加常驻循环、远程资源或数据请求。
- `permissions` 仅保留 `script`，`network` 保持空数组；没有定时刷新。
- 页面使用 `aidget-surface="none"`，不要添加窗口材质或 `backdrop-filter`。

## 平台

- `config.json` 按要求声明 `macos`、`windows` 和 `linux`；实际 Aidget 渲染检查目前只在
  macOS 完成。其他系统出现差异时在实现层修复，不要删掉扫光效果或加平台分支。
