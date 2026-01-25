# 技术挑战：将 Remotion 集成到 QCut

> **文档版本：** 1.0.0
> **最后更新：** 2026-01-25
> **作者：** 开发团队

---

## 执行摘要

将 Remotion（基于 React 的视频框架）集成到 QCut（基于 Canvas 的视频编辑器）中，由于根本性的架构差异，带来了重大的技术挑战。本文档解释了核心问题、产生原因以及实施的解决方案。

---

## 目录

1. [架构对比](#架构对比)
2. [核心技术挑战](#核心技术挑战)
3. [挑战一：两种不同的渲染范式](#挑战一两种不同的渲染范式)
4. [挑战二：合成尺寸与显示尺寸](#挑战二合成尺寸与显示尺寸)
5. [挑战三：异步播放器初始化](#挑战三异步播放器初始化)
6. [挑战四：帧同步](#挑战四帧同步)
7. [挑战五：状态管理集成](#挑战五状态管理集成)
8. [挑战六：导出管线复杂性](#挑战六导出管线复杂性)
9. [经验教训](#经验教训)

---

## 架构对比

### QCut 的原生架构

QCut 使用 **Canvas 2D 渲染管线**：

```
┌─────────────────────────────────────────────────────────────┐
│                    QCut 渲染管线                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   时间轴状态 (Zustand)                                       │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────┐    直接像素操作                            │
│   │ Canvas 2D   │◄── • drawImage() 用于视频/图片             │
│   │ Context     │    • fillText() 用于文字叠加               │
│   └─────────────┘    • 即时模式渲染                          │
│         │                                                   │
│         ▼                                                   │
│   帧缓冲区 ──► FFmpeg WASM ──► 视频文件                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**关键特征：**
- 即时模式渲染（绘制命令立即执行）
- 通过 `getImageData()`/`putImageData()` 直接访问像素
- 导出时逐帧控制
- 无虚拟 DOM 开销

### Remotion 的架构

Remotion 使用 **React DOM 渲染管线**：

```
┌─────────────────────────────────────────────────────────────┐
│                   Remotion 渲染管线                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   帧号 (currentFrame)                                        │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────┐    React 协调                              │
│   │ React       │◄── • useCurrentFrame() 钩子                │
│   │ 组件        │    • 虚拟 DOM 差异比对                      │
│   └─────────────┘    • spring()/interpolate() 动画          │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────┐    浏览器渲染                              │
│   │ DOM/CSS/    │◄── • 布局计算                              │
│   │ Canvas/SVG  │    • 绑制操作                              │
│   └─────────────┘    • 合成                                  │
│         │                                                   │
│         ▼                                                   │
│   @remotion/renderer (Puppeteer) ──► 视频文件                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**关键特征：**
- 保留模式渲染（React 管理 DOM 状态）
- 声明式动画与帧号绑定
- 使用浏览器渲染引擎进行布局
- 导出需要无头浏览器

---

## 核心技术挑战

| 挑战 | 根本原因 | 严重程度 |
|------|----------|----------|
| 渲染范式不匹配 | Canvas 2D vs React DOM | 严重 |
| 尺寸混淆 | 合成尺寸 vs 显示尺寸 | 高 |
| 异步初始化 | React ref 时序 | 高 |
| 帧同步 | 不同的时间模型 | 中 |
| 状态集成 | 独立的 store 系统 | 中 |
| 导出复杂性 | 不同的导出管线 | 高 |

---

## 挑战一：两种不同的渲染范式

### 问题

QCut 直接渲染到 Canvas 2D context。Remotion 将 React 组件渲染到 DOM。这两者无法直接合成。

```
QCut 元素：          Remotion 元素：
┌──────────┐        ┌──────────┐
│ Canvas   │        │ React    │
│ 2D API   │   ≠    │ DOM      │
│ (像素)   │        │ (节点)   │
└──────────┘        └──────────┘
     ↓                   ↓
  ImageData           HTML/CSS
```

### 为什么困难

1. **无法直接访问像素**：React 组件渲染到 DOM，而非像素
2. **异步渲染**：React 的协调过程是异步的
3. **布局依赖**：Remotion 组件可能使用 Canvas 中不存在的 CSS 布局特性（flexbox、grid）

### 解决方案

使用 `@remotion/player` 作为桥梁：

```typescript
// Player 组件将 Remotion 渲染到一个包含的 DOM 元素中
// 然后可以捕获或合成
<Player
  component={RemotionComponent}
  compositionWidth={1920}
  compositionHeight={1080}
  // ... 属性
/>
```

**文件：** `src/lib/remotion/player-wrapper.tsx`

Player 内部使用 iframe 或 shadow DOM 来隔离 Remotion 的渲染，然后我们可以：
1. 让 Remotion 渲染到其容器
2. 将容器定位在 QCut 的预览中
3. 导出时，通过 canvas 捕获提取帧

---

## 挑战二：合成尺寸与显示尺寸

### 问题

这是最微妙的 bug 之一。Remotion 的 `<Player>` 有两个不同的尺寸概念：

| 属性 | 用途 |
|------|------|
| `compositionWidth/Height` | 内部坐标系统 (1920×1080) |
| 容器 CSS `width/height` | 屏幕上的显示尺寸 (640×360) |

**最初的 Bug：**
```typescript
// 错误：对两者都使用预览尺寸
<Player
  compositionWidth={previewWidth}   // 640 - 错误！
  compositionHeight={previewHeight}  // 360 - 错误！
  style={{ width: previewWidth, height: previewHeight }}
/>
```

### 为什么会出问题

Remotion 组件使用基于合成尺寸的绝对定位：

```typescript
// Lower Third 组件期望 1920×1080
const LowerThird = () => {
  return (
    <AbsoluteFill>
      <div style={{
        position: 'absolute',
        bottom: 80,  // 距离 1080px 底部 80px
        left: 60,    // 距离 1920px 左边 60px
      }}>
        {/* 内容 */}
      </div>
    </AbsoluteFill>
  );
};
```

当 `compositionHeight` 设置为 360 而非 1080 时：
- `bottom: 80` 使元素位于距顶部 280px (360 - 80)
- 在 1080p 合成中，它应该在距顶部 1000px
- 元素出现在错误的位置或可见区域之外

### 修复方案

**文件：** `src/lib/remotion/player-wrapper.tsx`

```typescript
// 正确：对合成使用组件的原生尺寸
const compositionWidth = component.width;   // 1920
const compositionHeight = component.height; // 1080

// 对显示尺寸使用 props
const displayWidth = width ?? component.width;
const displayHeight = height ?? component.height;

<div style={{ width: displayWidth, height: displayHeight }}>
  <Player
    compositionWidth={compositionWidth}   // 始终是原生尺寸 (1920)
    compositionHeight={compositionHeight} // 始终是原生尺寸 (1080)
    style={{ width: '100%', height: '100%' }} // CSS 处理缩放
  />
</div>
```

Remotion Player 内部处理缩放变换。

---

## 挑战三：异步播放器初始化

### 问题

React refs 在组件挂载后异步设置。代码过早地检查 ref：

```typescript
// 有问题的代码
useEffect(() => {
  const player = playerRef.current;
  if (!player) return; // 第一次渲染时立即返回！

  // 这永远不会运行，因为 ref 还没设置
  onReady?.();
}, [onReady]);
```

### Bug 时间线

```
T0: 组件渲染，useEffect 排队
T1: useEffect 运行，playerRef.current = null，提前退出
T2: <Player> 挂载，设置 playerRef.current = PlayerInstance
T3: 什么都没发生 - effect 不会重新运行
    onReady() 永远不会被调用
    isReady 永远保持 false
```

### 修复方案

**文件：** `src/lib/remotion/player-wrapper.tsx`

```typescript
// 跟踪播放器实际挂载的时间
const [isPlayerMounted, setIsPlayerMounted] = useState(false);

// 检测 ref 何时可用的 Effect
useEffect(() => {
  const checkRef = () => {
    if (playerRef.current && !isPlayerMounted) {
      setIsPlayerMounted(true);
    }
  };

  checkRef(); // 立即检查
  const timer = setTimeout(checkRef, 50); // 延迟后也检查

  return () => clearTimeout(timer);
}, [isPlayerMounted]);

// 只在挂载后设置监听器
useEffect(() => {
  if (!isPlayerMounted) return;

  const player = playerRef.current;
  if (!player) return;

  // 设置事件监听器...
  onReady?.(); // 现在这实际上会运行！
}, [isPlayerMounted, onReady]);
```

---

## 挑战四：帧同步

### 问题

QCut 和 Remotion 有不同的时间/帧模型：

| 方面 | QCut | Remotion |
|------|------|----------|
| 时间单位 | 秒（浮点数） | 帧（整数） |
| 播放 | 连续 | 离散帧 |
| FPS | 可变 | 每个合成固定 |

### 同步流程

```
QCut 时间轴                      Remotion 播放器
     │                                │
     │ currentTime = 5.5s             │
     │                                │
     ├──── 转换为帧 ──────────────────┤
     │     frame = floor(5.5 * 30)    │
     │     frame = 165                │
     │                                │
     │                    seekTo(165) │
     │                                │
     ▼                                ▼
预览                             渲染第 165 帧
```

### 实现

**文件：** `src/components/editor/preview-panel.tsx`

```typescript
if (element.type === "remotion") {
  const remotionElement = element as RemotionElement;

  // 计算元素内的本地时间
  const elementStart = remotionElement.startTime + remotionElement.trimStart;
  const localTime = currentTime - elementStart;

  // 转换为帧号
  const fps = 30; // 从组件定义获取
  const currentFrame = Math.max(0, Math.floor(localTime * fps));

  // 传递给 Remotion 播放器进行定位
  return (
    <RemotionPreview
      currentFrame={currentFrame}
      // ...
    />
  );
}
```

---

## 挑战五：状态管理集成

### 问题

QCut 使用多个 Zustand stores。Remotion 组件需要自己的状态（注册表、实例、缓存）。这些必须协调：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ timeline-store  │◄───►│ remotion-store  │◄───►│ playback-store  │
│                 │     │                 │     │                 │
│ • elements[]    │     │ • components    │     │ • currentTime   │
│ • tracks[]      │     │ • instances     │     │ • isPlaying     │
│ • selection     │     │ • cache         │     │ • fps           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  preview-panel  │
                        │  (统一视图)      │
                        └─────────────────┘
```

### 关键集成点

**文件：** `src/stores/remotion-store.ts`

```typescript
interface RemotionStore {
  // 组件定义（已注册的模板）
  registeredComponents: Map<string, RemotionComponentDefinition>;

  // 活动实例（时间轴上的元素）
  instances: Map<string, RemotionInstance>;

  // 操作
  registerComponent: (def: RemotionComponentDefinition) => void;
  createInstance: (elementId: string, componentId: string, props: object) => void;
  destroyInstance: (elementId: string) => void;
}

// 在 store 创建时初始化内置组件
initialize: () => {
  for (const definition of builtInComponentDefinitions) {
    newComponents.set(definition.id, definition);
  }
}
```

---

## 挑战六：导出管线复杂性

### 问题

QCut 的导出使用 FFmpeg WASM 和直接的 canvas 帧。Remotion 导出使用带有 `@remotion/renderer` 的无头 Chrome。这些无法轻易合并。

### 导出策略选项

| 选项 | 优点 | 缺点 |
|------|------|------|
| A. 预渲染 Remotion 为帧 | 合成简单 | 双重编码，存储开销 |
| B. 混合实时 | 无需预渲染 | 同步复杂 |
| C. 纯 Remotion 导出 | 最佳质量 | 需要 Remotion CLI |

### 实现的方案：预渲染 + 合成

```
导出开始
      │
      ▼
┌─────────────────────────────────┐
│ 1. 预渲染 Remotion 元素          │
│    • 对每个 Remotion 元素        │
│    • 渲染帧到缓存                │
│    • 存储为 PNG 或内存中         │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ 2. 主导出循环                    │
│    对每个输出帧：                 │
│    • 渲染 QCut 原生图层          │
│    • 加载缓存的 Remotion 帧      │
│    • 按 z-order 合成图层         │
│    • 发送到 FFmpeg 编码器        │
└─────────────────────────────────┘
      │
      ▼
视频文件
```

**文件：**
- `src/lib/remotion/pre-renderer.ts` - 将 Remotion 渲染到帧缓存
- `src/lib/remotion/compositor.ts` - 合并图层
- `src/lib/remotion/export-engine-remotion.ts` - 导出编排

---

## 经验教训

### 1. 理解两个坐标系统

Remotion 使用 **合成坐标**（视频的原生分辨率），而 UI 使用 **显示坐标**（适合屏幕的尺寸）。始终保持这两者分离。

### 2. React Refs 是异步的

永远不要假设 ref 会立即设置。使用状态跟踪或回调 refs 来检测组件何时实际挂载。

### 3. 桥接，而非替换

与其在 Canvas 中重写 Remotion 的渲染，不如使用 `@remotion/player` 作为桥梁。让每个系统做它擅长的事。

### 4. 使用可见的组件测试

调试渲染问题时，使用高度可见的测试组件（明亮的颜色、全帧覆盖），而不是像 Lower Thirds 这样微妙的组件。

### 5. 开发期间记录一切

策略性的 console.log 语句节省了数小时的调试时间：

```typescript
console.log("[RemotionPreview] 状态:", {
  componentId,
  isReady,
  hasError,
  dimensions,
});
```

---

## 架构决策记录

### ADR-001：使用 @remotion/player 进行预览

**决策：** 使用官方 `@remotion/player` 包而非自定义渲染。

**理由：**
- Remotion 团队官方支持
- 正确处理 React 生命周期
- 提供命令式控制（play、pause、seekTo）
- 保持与 Remotion 更新的兼容性

### ADR-002：分离合成和显示尺寸

**决策：** 始终对 `compositionWidth/Height` 使用组件的原生尺寸。

**理由：**
- 确保在所有预览尺寸下定位一致
- 让 CSS 处理显示缩放
- 与 Remotion Studio 的工作方式匹配

### ADR-003：导出时预渲染

**决策：** 在主导出之前将 Remotion 元素预渲染到帧缓存。

**理由：**
- 将 Remotion 渲染与主时间轴解耦
- 允许并行处理
- 简化主导出循环

---

## 相关文档

| 文档 | 路径 |
|------|------|
| 架构概述 | `01-architecture.md` |
| 故障排除指南 | `TROUBLESHOOTING.md` |
| 实施计划 | `IMPLEMENTATION-PLAN.md` |
| Remotion 渲染器 | `02-remotion-renderer.md` |

---

## 变更日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-01-25 | 初始技术挑战文档 |

---

*本文档反映了实际实施中获得的宝贵经验。发现和解决新挑战时请更新它。*
