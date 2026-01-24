# 02 - Adding Remotion as a Rendering Engine

## Overview

This document describes how to integrate Remotion's rendering capabilities into QCut, allowing Remotion components to be rendered alongside native QCut elements.

## Dependencies to Add

```json
{
  "dependencies": {
    "@remotion/player": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "remotion": "^4.0.0"
  }
}
```

## Remotion Player Integration

### Player Wrapper Component

A wrapper that embeds Remotion's `<Player>` into QCut's preview panel:

```
┌─────────────────────────────────────────┐
│           QCut Preview Panel            │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │      QCut Canvas Layer          │    │
│  │      (z-index: 1)               │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │    Remotion Player Layer        │    │
│  │      (z-index: 2)               │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │     Composite Output Layer      │    │
│  │      (z-index: 3)               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Player Configuration

| Property | Value | Purpose |
|----------|-------|---------|
| `fps` | Match QCut project | Sync frame rates |
| `compositionWidth` | 1920 | Match QCut canvas |
| `compositionHeight` | 1080 | Match QCut canvas |
| `controls` | false | QCut controls playback |
| `loop` | false | Timeline controls looping |
| `inputProps` | Dynamic | Pass element props |

### Frame Synchronization

```
QCut Playback Controller
        │
        │ currentFrame: 150
        ▼
┌───────────────────────┐
│   Sync Manager        │
├───────────────────────┤
│ qcutFrame → timestamp │
│ timestamp → remFrame  │
└───────────────────────┘
        │
        ├────────────────────────┐
        ▼                        ▼
  QCut Canvas              Remotion Player
  seekTo(150)              seekTo(5.0s)
```

## Component Registration System

### Registry Structure

```
RemotionComponentRegistry
├── built-in/
│   ├── FadeIn
│   ├── SlideIn
│   ├── ScaleUp
│   ├── TypeWriter
│   └── SpringBounce
├── imported/
│   ├── user-component-1.tsx
│   └── user-component-2.tsx
└── templates/
    ├── IntroScene
    ├── OutroScene
    └── LowerThird
```

### Component Definition

```typescript
interface RemotionComponentDefinition {
  id: string;
  name: string;
  category: 'animation' | 'scene' | 'effect' | 'template';
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  schema: ZodSchema;        // Props validation
  defaultProps: object;
  thumbnail?: string;       // Preview image
  component: React.FC<any>; // The actual component
}
```

### Import Flow

```
User selects .tsx file
        │
        ▼
┌───────────────────────┐
│   Component Parser    │
├───────────────────────┤
│ • Validate structure  │
│ • Extract metadata    │
│ • Check dependencies  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   Sandbox Validator   │
├───────────────────────┤
│ • No fs access        │
│ • No network calls    │
│ • Safe APIs only      │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   Registry Add        │
├───────────────────────┤
│ • Assign unique ID    │
│ • Generate thumbnail  │
│ • Store in IndexedDB  │
└───────────────────────┘
        │
        ▼
Available in Media Panel
```

## Frame Extraction

### Live Preview Extraction

For timeline scrubbing, extract frames from the Remotion player:

```
Remotion Player (offscreen)
        │
        ▼
┌───────────────────────┐
│  html2canvas / DOM    │
│  to Canvas capture    │
└───────────────────────┘
        │
        ▼
    Canvas ImageData
        │
        ▼
┌───────────────────────┐
│   Frame Buffer        │
│   (ring buffer)       │
└───────────────────────┘
        │
        ▼
  Compositor Input
```

### Export Rendering

For final export, use Remotion's `renderMedia`:

```
Export Triggered
        │
        ▼
┌───────────────────────────────────────┐
│  Collect Remotion Elements            │
│  from timeline                        │
└───────────────────────────────────────┘
        │
        ▼
For each RemotionElement:
        │
        ▼
┌───────────────────────────────────────┐
│  renderMedia({                        │
│    composition,                       │
│    outputLocation: tempDir,           │
│    codec: 'png-sequence',             │
│    imageFormat: 'png'                 │
│  })                                   │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Cache frame sequence                 │
│  Map: frameNumber → imagePath         │
└───────────────────────────────────────┘
        │
        ▼
  Ready for compositing
```

## Rendering Modes

### Mode 1: Overlay Rendering

Remotion renders on top of QCut canvas:

```
┌─────────────────────┐
│   QCut Canvas       │  ← Base layer
├─────────────────────┤
│   Remotion Layer    │  ← Overlay (with transparency)
└─────────────────────┘
```

**Use Case:** Animated text overlays, lower thirds, transitions

### Mode 2: Inline Rendering

Remotion element treated as video clip:

```
┌───────┬───────────────┬───────┐
│ Video │ Remotion Clip │ Video │  ← Same track
└───────┴───────────────┴───────┘
```

**Use Case:** Intro scenes, title cards, animated segments

### Mode 3: Effect Rendering

Remotion applies effect to QCut content:

```
QCut Element
     │
     ▼
┌─────────────────────┐
│  Remotion Effect    │
│  (receives frame)   │
└─────────────────────┘
     │
     ▼
Processed Frame
```

**Use Case:** Animated filters, distortion effects, color grading

## Error Handling

| Error | Handling |
|-------|----------|
| Component fails to load | Show placeholder, log error |
| Render timeout | Skip frame, use last good frame |
| Memory overflow | Reduce cache size, warn user |
| Invalid props | Show validation error in properties panel |
| Missing dependencies | Prompt to install, show fallback |

## Performance Optimization

### Caching Strategy

```
┌─────────────────────────────────────────┐
│           Frame Cache (LRU)             │
├─────────────────────────────────────────┤
│  Key: componentId + frame + propsHash   │
│  Value: ImageBitmap                     │
│  Max Size: 500MB (configurable)         │
│  Eviction: Least Recently Used          │
└─────────────────────────────────────────┘
```

### Keyframe Pre-rendering

For smooth scrubbing:

```
Timeline: [0 -------- 100 -------- 200 -------- 300]
                │          │           │
                ▼          ▼           ▼
         Keyframe 0   Keyframe 1   Keyframe 2
         (cached)     (cached)     (cached)

Scrub to frame 150:
  → Interpolate between Keyframe 1 (100) and Keyframe 2 (200)
  → Or render on-demand if cache miss
```

### Worker Thread Rendering

Offload Remotion rendering to worker:

```
Main Thread                    Worker Thread
     │                              │
     │  renderRequest(frame)        │
     │─────────────────────────────►│
     │                              │ Remotion render
     │                              │ ...
     │      frameData               │
     │◄─────────────────────────────│
     │                              │
   Display                          │
```
