# 03 - Bridging QCut Timeline to Remotion Components

## Overview

This document describes how QCut timeline elements map to Remotion components and how the two systems communicate.

## Timeline Element Mapping

### QCut Timeline Structure

```
Timeline
├── Track 1 (Video)
│   ├── Element: video.mp4 [0-150]
│   └── Element: remotion:intro [150-250]
├── Track 2 (Text)
│   ├── Element: "Hello" [50-200]
│   └── Element: remotion:typewriter [200-300]
└── Track 3 (Audio)
    └── Element: music.mp3 [0-300]
```

### Remotion Composition Structure

```tsx
<Composition>
  <Sequence from={0} durationInFrames={150}>
    <Video src="video.mp4" />
  </Sequence>
  <Sequence from={150} durationInFrames={100}>
    <IntroComponent />
  </Sequence>
  <Sequence from={50} durationInFrames={150}>
    <Text content="Hello" />
  </Sequence>
  <Sequence from={200} durationInFrames={100}>
    <TypewriterComponent />
  </Sequence>
</Composition>
```

## Bridge Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    QCut Timeline                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ elements: TimelineElement[]                      │    │
│  │ tracks: Track[]                                  │    │
│  │ currentFrame: number                             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Timeline Bridge                        │
├─────────────────────────────────────────────────────────┤
│  • Filter Remotion elements                             │
│  • Calculate relative frame positions                   │
│  • Map props from QCut properties to Remotion props     │
│  • Handle z-index / layer ordering                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                Remotion Render Context                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ activeComponents: RemotionInstance[]             │    │
│  │ globalFrame: number                              │    │
│  │ renderQueue: RenderJob[]                         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Property Mapping

### QCut Element Properties → Remotion Props

| QCut Property | Remotion Prop | Transformation |
|---------------|---------------|----------------|
| `element.start` | `from` | Direct (frames) |
| `element.duration` | `durationInFrames` | Direct (frames) |
| `element.position.x` | `style.left` | Pixels |
| `element.position.y` | `style.top` | Pixels |
| `element.scale` | `style.transform: scale()` | Percentage → decimal |
| `element.rotation` | `style.transform: rotate()` | Degrees |
| `element.opacity` | `style.opacity` | 0-100 → 0-1 |
| `element.effects` | Custom effect props | Effect-specific mapping |

### Keyframe Mapping

QCut keyframes to Remotion interpolation:

```
QCut Keyframes:
  frame 0:   opacity = 0
  frame 30:  opacity = 100
  frame 100: opacity = 100
  frame 130: opacity = 0

Remotion Equivalent:
  const opacity = interpolate(
    frame,
    [0, 30, 100, 130],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
```

## Component Instance Management

### Instance Lifecycle

```
Element added to timeline
        │
        ▼
┌───────────────────────┐
│   Create Instance     │
├───────────────────────┤
│ • Load component def  │
│ • Initialize props    │
│ • Allocate resources  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   Register Instance   │
├───────────────────────┤
│ • Add to render queue │
│ • Start pre-caching   │
│ • Bind to timeline    │
└───────────────────────┘
        │
        ▼
    Instance Active
        │
        │ (element removed or project closed)
        ▼
┌───────────────────────┐
│   Dispose Instance    │
├───────────────────────┤
│ • Clear cache         │
│ • Release memory      │
│ • Remove from queue   │
└───────────────────────┘
```

### Multiple Instances

Same component, different properties:

```
Timeline:
  [Remotion:TypeWriter "Hello" at 0-100]
  [Remotion:TypeWriter "World" at 150-250]

Instance Map:
  instance-1: TypeWriter { text: "Hello", start: 0 }
  instance-2: TypeWriter { text: "World", start: 150 }

Each instance maintains:
  • Own prop state
  • Own frame cache
  • Independent rendering
```

## Frame Coordinate Translation

### Global vs Local Frame

```
Global Timeline:    0 ─────────────────────────────── 300
                              │
Element Start: 100            │
Element End: 200              │
                              ▼
                    ┌─────────────────┐
                    │ Remotion Element│
                    │ frames 100-200  │
                    └─────────────────┘
                              │
                              ▼
Local Frame:        0 ─────── 100 (within component)

Translation:
  localFrame = globalFrame - element.start
  globalFrame = localFrame + element.start
```

### Frame Request Flow

```
User scrubs to global frame 150
        │
        ▼
┌───────────────────────────────────────┐
│  For each active Remotion element:    │
│  if (150 >= element.start &&          │
│      150 < element.start + duration)  │
│  {                                    │
│    localFrame = 150 - element.start   │
│    requestFrame(element.id, localFrame)│
│  }                                    │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Remotion Player seeks to localFrame  │
│  (e.g., frame 50 within component)    │
└───────────────────────────────────────┘
```

## Effect Integration

### QCut Effects on Remotion Elements

Apply QCut effects to Remotion output:

```
Remotion Component Output
        │
        ▼
┌───────────────────────┐
│  Frame as ImageData   │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  QCut Effect Chain    │
├───────────────────────┤
│  • Blur               │
│  • Color adjustment   │
│  • Glow               │
└───────────────────────┘
        │
        ▼
   Processed Frame
```

### Remotion Effects on QCut Elements

Pass QCut content through Remotion:

```
QCut Element (rendered to canvas)
        │
        ▼
┌───────────────────────┐
│  Canvas to Texture    │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Remotion Effect      │
│  (receives as prop)   │
├───────────────────────┤
│  <EffectComponent     │
│    sourceFrame={tex}  │
│    frame={frame}      │
│  />                   │
└───────────────────────┘
        │
        ▼
   Effected Frame
```

## Event Propagation

### Timeline Events → Remotion

| QCut Event | Remotion Action |
|------------|-----------------|
| `play` | `playerRef.play()` |
| `pause` | `playerRef.pause()` |
| `seek(frame)` | `playerRef.seekTo(frame)` |
| `setPlaybackRate(rate)` | `playerRef.setPlaybackRate(rate)` |
| `elementUpdated` | Re-render with new props |
| `elementMoved` | Update `from` position |
| `elementResized` | Update `durationInFrames` |

### Remotion Events → Timeline

| Remotion Event | QCut Action |
|----------------|-------------|
| `onError` | Show error in timeline element |
| `onEnded` | Trigger next element (if auto-play) |
| `onFrameUpdate` | Sync progress indicator |
| `onRenderComplete` | Update cache, enable scrubbing |

## Conflict Resolution

### Z-Index Conflicts

When QCut and Remotion elements overlap:

```
Conflict: Both at z-index 5

Resolution Priority:
1. Track order (higher track = front)
2. Element type (Remotion on top by default)
3. User-defined z-index override

Result:
  Track 3 elements: z-index 30-39
  Track 2 elements: z-index 20-29
  Track 1 elements: z-index 10-19
```

### Timing Conflicts

When elements have overlapping time ranges:

```
Element A: [0 ────────── 100]
Element B:        [50 ────────── 150]

Overlap Region: [50 ─── 100]

Handling:
  • Both render simultaneously
  • Compositor merges based on z-index
  • Blending mode applied if specified
```

## State Synchronization

### Bi-directional Sync

```
┌─────────────────────────────────────────────────────────┐
│                 Sync Manager                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  QCut State ◄───────────────────────► Remotion State   │
│                                                         │
│  • currentFrame        sync          • currentFrame     │
│  • isPlaying           sync          • isPlaying        │
│  • playbackRate        sync          • playbackRate     │
│  • element.props       ──►           • inputProps       │
│  • effect.params       ──►           • effect.params    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Debouncing Updates

Prevent excessive re-renders:

```
Property Change
        │
        ▼
┌───────────────────────┐
│   Debounce (16ms)     │
│   Batch updates       │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   Apply batched       │
│   props to Remotion   │
└───────────────────────┘
```
