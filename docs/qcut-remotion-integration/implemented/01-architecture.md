# 01 - Dual Rendering Architecture

## Current QCut Architecture

```
Timeline State (Zustand)
        │
        ▼
┌───────────────────┐
│  Canvas Renderer  │
│  (2D Context)     │
├───────────────────┤
│ • Draw video      │
│ • Draw text       │
│ • Apply effects   │
│ • Position layers │
└───────────────────┘
        │
        ▼
   Frame Output
        │
        ▼
┌───────────────────┐
│   FFmpeg WASM     │
│   (Encoding)      │
└───────────────────┘
        │
        ▼
   Video File
```

## Proposed Dual Architecture

```
Timeline State (Zustand)
        │
        ├──────────────────────────────┐
        ▼                              ▼
┌───────────────────┐      ┌───────────────────┐
│  QCut Elements    │      │ Remotion Elements │
│  (Native)         │      │ (Imported)        │
└───────────────────┘      └───────────────────┘
        │                              │
        ▼                              ▼
┌───────────────────┐      ┌───────────────────┐
│  Canvas Renderer  │      │  Remotion Player  │
│  (Existing)       │      │  (New)            │
└───────────────────┘      └───────────────────┘
        │                              │
        └──────────┬───────────────────┘
                   ▼
        ┌───────────────────┐
        │  Frame Compositor │
        │  (New Layer)      │
        ├───────────────────┤
        │ • Z-order sorting │
        │ • Alpha blending  │
        │ • Layer merge     │
        └───────────────────┘
                   │
                   ▼
            Frame Output
                   │
                   ▼
        ┌───────────────────┐
        │  Export Engine    │
        │  (FFmpeg/Remotion)│
        └───────────────────┘
                   │
                   ▼
            Video File
```

## Component Types

### QCut Native Elements

Elements rendered by existing Canvas 2D pipeline:

| Type | Renderer | Notes |
|------|----------|-------|
| Video Clip | Canvas drawImage | Existing |
| Image | Canvas drawImage | Existing |
| Text Overlay | Canvas fillText | Existing |
| Sticker | Canvas drawImage | Existing |
| Shape | Canvas path | Existing |
| Effect | Canvas filter | Existing |

### Remotion Elements

New element type for Remotion compositions:

| Type | Renderer | Notes |
|------|----------|-------|
| RemotionComponent | React DOM → Canvas | New |
| RemotionScene | React DOM → Canvas | New |
| RemotionTemplate | React DOM → Canvas | New |

## Timeline Element Schema

### Existing QCut Element

```typescript
interface TimelineElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'sticker' | 'audio';
  trackId: string;
  start: number;      // Frame number
  duration: number;   // Frame count
  src?: string;
  effects: Effect[];
  // ... existing properties
}
```

### New Remotion Element

```typescript
interface RemotionElement extends TimelineElement {
  type: 'remotion';
  componentId: string;           // Reference to Remotion composition
  componentPath: string;         // Path to .tsx file
  props: Record<string, unknown>; // Props to pass to component
  renderMode: 'live' | 'cached'; // Live preview or pre-rendered
}
```

## Rendering Modes

### Preview Mode (Live)

For timeline preview and scrubbing:

```
Frame Request (currentFrame: 150)
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
┌─────────────────┐             ┌─────────────────┐
│ QCut Canvas     │             │ Remotion Player │
│ render(frame)   │             │ seekTo(frame)   │
└─────────────────┘             └─────────────────┘
        │                                 │
        ▼                                 ▼
   Canvas Output                  React DOM Output
        │                                 │
        └───────────┬─────────────────────┘
                    ▼
            ┌───────────────┐
            │  Compositor   │
            │  mergeFrames()│
            └───────────────┘
                    │
                    ▼
             Preview Canvas
```

### Export Mode (Cached)

For final video rendering:

```
Export Start
        │
        ▼
┌─────────────────────────────────────┐
│  Pre-render Remotion Components     │
│  renderMedia() → Frame Sequence     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Cache Remotion Frames              │
│  Store as PNG sequence or video     │
└─────────────────────────────────────┘
        │
        ▼
For each frame:
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
   QCut render()              Load cached Remotion frame
        │                                 │
        └───────────┬─────────────────────┘
                    ▼
              Composite
                    │
                    ▼
            FFmpeg encode
```

## State Management

### New Zustand Store: `remotion-store.ts`

```
remotion-store
├── registeredComponents: Map<id, RemotionComponentDef>
├── componentCache: Map<id, RenderedFrames>
├── playerInstances: Map<id, PlayerRef>
└── actions:
    ├── registerComponent()
    ├── importComponent()
    ├── renderToCache()
    ├── seekComponent()
    └── getFrame()
```

### Integration with Existing Stores

```
timeline-store ◄────► remotion-store
      │                     │
      │  Element CRUD       │  Component registry
      │  Playback state     │  Frame cache
      │                     │
      └────────┬────────────┘
               │
               ▼
        preview-panel
        (unified render)
```

## File System Structure

```
qcut/
└── apps/web/src/
    ├── lib/
    │   ├── remotion/                    # NEW
    │   │   ├── player.tsx               # Remotion player wrapper
    │   │   ├── renderer.ts              # Frame extraction
    │   │   ├── compositor.ts            # Layer merging
    │   │   └── component-loader.ts      # Dynamic imports
    │   └── export-engine.ts             # Modified
    ├── stores/
    │   └── remotion-store.ts            # NEW
    └── components/editor/
        ├── timeline/
        │   └── remotion-element.tsx     # NEW
        └── properties-panel/
            └── remotion-properties.tsx  # NEW
```

## Performance Considerations

| Concern | Solution |
|---------|----------|
| React DOM overhead | Render to offscreen canvas, extract frames |
| Memory usage | LRU cache for rendered frames |
| Scrubbing latency | Pre-render keyframes, interpolate between |
| Export speed | Batch render Remotion first, then composite |
