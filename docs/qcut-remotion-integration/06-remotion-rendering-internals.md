# 06 - Remotion Rendering Internals

> **Purpose:** Understanding how Remotion renders internally, and whether we can replicate this in QCut's canvas.

---

## Table of Contents

1. [Remotion's Rendering Pipeline](#remotions-rendering-pipeline)
2. [Current QCut Preview Design](#current-qcut-preview-design)
3. [Can We Render in Canvas?](#can-we-render-in-canvas)
4. [Recommended Approach](#recommended-approach)

---

## Remotion's Rendering Pipeline

### Core Architecture

Remotion uses a **frame-state-driven React re-render loop**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Remotion Player Rendering                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PLAYBACK LOOP (use-playback.ts)                                │
│     ├─ requestAnimationFrame() callback fires                      │
│     ├─ calculateNextFrame() based on elapsed time                  │
│     └─ setFrame() updates React state                              │
│                          │                                          │
│                          ▼                                          │
│  2. STATE PROPAGATION                                               │
│     ├─ Frame state stored as: {[PLAYER_COMP_ID]: frameNumber}      │
│     ├─ TimelineContext.Provider propagates frame                   │
│     └─ Memoized context prevents unnecessary re-renders            │
│                          │                                          │
│                          ▼                                          │
│  3. COMPONENT SUBSCRIPTION                                          │
│     ├─ useCurrentFrame() hook reads from TimelineContext           │
│     ├─ Components using hook re-render with new frame              │
│     └─ spring()/interpolate() calculate animations                 │
│                          │                                          │
│                          ▼                                          │
│  4. REACT RENDERS TO DOM                                            │
│     ├─ Virtual DOM diffing                                         │
│     ├─ Browser layout calculation (CSS flexbox, grid, etc.)        │
│     └─ Paint operations (text, images, SVG, canvas)                │
│                          │                                          │
│                          ▼                                          │
│  5. CSS TRANSFORM SCALING                                           │
│     ├─ Container measures actual size via useElementSize()         │
│     ├─ Scale = min(containerW/compW, containerH/compH)             │
│     └─ transform: scale(${scale}) with margin centering            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Source Files

| File | Purpose |
|------|---------|
| `packages/player/src/Player.tsx` | Main Player component, frame state storage |
| `packages/player/src/SharedPlayerContext.tsx` | Context providers stack |
| `packages/player/src/PlayerUI.tsx` | Rendering, scaling, error handling |
| `packages/player/src/use-playback.ts` | requestAnimationFrame loop |
| `packages/player/src/calculate-scale.ts` | CSS transform calculations |
| `packages/core/src/use-current-frame.ts` | Hook for reading frame |

### Frame State Storage

```typescript
// Player.tsx - Frame stored as React state
const [frame, setFrame] = useState<Record<string, number>>(() => ({
    [PLAYER_COMP_ID]: initialFrame ?? 0,
}));

// TimelineContext provides frame to all children
const timelineContextValue = useMemo((): TimelineContextValue => {
    return {
        frame,           // ← Current frame per composition
        playing,
        rootId,
        playbackRate,
        // ...
    };
}, [frame, playing, rootId, playbackRate]);
```

### Playback Loop

```typescript
// use-playback.ts - requestAnimationFrame drives updates
const callback = useCallback(() => {
    const time = performance.now();
    const nextFrame = calculateNextFrame({
        time,
        startTime: lastTimeRef.current,
        currentFrame: currentFrameRef.current,
        playbackSpeed: currentPlaybackRate,
        fps: config.fps,
    });

    setFrame((c) => ({...c, [config.id]: nextFrame}));

    // Queue next frame
    frameRef.current = requestAnimationFrame(callback);
}, [config.fps, config.id, currentPlaybackRate, setFrame]);
```

### Scaling Mechanism

```typescript
// calculate-scale.ts
const scale = Math.min(
    canvasSize.width / compositionWidth,
    canvasSize.height / compositionHeight
);

// Applied via CSS
containerStyle = {
    transform: `scale(${scale})`,
    marginLeft: xCorrection,
    marginTop: yCorrection,
};
```

### Context Stack (Deep Nesting)

```
RemotionEnvironmentContext
  └─ LogLevelContext
      └─ CanUseRemotionHooksProvider
          └─ TimelineContext              ← Frame + play state
              └─ CompositionManager       ← Composition registry
                  └─ PrefetchProvider
                      └─ DurationsContextProvider
                          └─ MediaVolumeContext
                              └─ SetMediaVolumeContext
                                  └─ SharedAudioContextProvider
                                      └─ BufferingProvider
                                          └─ {children}  ← Your composition
```

---

## Current QCut Preview Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QCut Remotion Integration                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  preview-panel.tsx                                                  │
│       │                                                             │
│       ├─── Native Elements (Canvas 2D) ─────┐                      │
│       │    • Video                          │                      │
│       │    • Images                         │                      │
│       │    • Text                           │                      │
│       │                                     │                      │
│       └─── Remotion Elements ───────────────┼──► Composited View   │
│            │                                │                      │
│            ▼                                │                      │
│       RemotionPreview                       │                      │
│            │                                │                      │
│            ▼                                │                      │
│       RemotionPlayerWrapper                 │                      │
│            │                                │                      │
│            ▼                                │                      │
│       @remotion/player <Player/>  ──────────┘                      │
│            │                                                        │
│            └─► DOM output (React components)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/remotion/player-wrapper.tsx` | Wraps Remotion Player with imperative API |
| `lib/remotion/remotion-store.ts` | Zustand store for components & instances |
| `lib/remotion/sync-manager.ts` | Frame sync between QCut timeline & Remotion |
| `lib/remotion/types.ts` | TypeScript interfaces |
| `components/editor/preview-panel/remotion-preview.tsx` | Preview UI component |

### How QCut Wraps Remotion

**player-wrapper.tsx:**

```typescript
export const RemotionPlayerWrapper = forwardRef<
  RemotionPlayerHandle,
  RemotionPlayerWrapperProps
>((props, ref) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);

  // Imperative API for external control
  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    seekTo: (frame) => playerRef.current?.seekTo(frame),
    getCurrentFrame: () => playerRef.current?.getCurrentFrame() ?? 0,
    extractFrame: async () => {
      // Extract canvas content as ImageBitmap
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) {
        return await createImageBitmap(canvas);
      }
      return null;
    },
  }));

  return (
    <div style={{ width: displayWidth, height: displayHeight }}>
      <Player
        ref={playerRef}
        component={component.component}
        compositionWidth={component.width}    // Always native (1920)
        compositionHeight={component.height}  // Always native (1080)
        durationInFrames={component.durationInFrames}
        fps={component.fps}
        inputProps={mergedProps}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
});
```

### Frame Synchronization Flow

```
QCut Timeline                         Remotion Players
     │                                      │
     │ currentTime = 5.5s                   │
     │                                      │
     ▼                                      │
SyncManager.syncToTime(5.5)                 │
     │                                      │
     ├─► Get active elements at 5.5s        │
     │                                      │
     ├─► For each active Remotion element:  │
     │   ├─► globalToLocalFrame()           │
     │   │   frame = (5.5 - startTime) * fps│
     │   │                                  │
     │   └─► playerRef.seekTo(frame) ───────┼──► Player updates
     │                                      │
     └─► Update syncState in store          │
                                            ▼
                                    Component re-renders
```

### Layer Composition in Preview

```typescript
// preview-panel.tsx - Layered rendering
<div className="preview-container">
  {/* Layer 1: Background */}
  <div className="blur-background" />

  {/* Layer 2-N: Timeline elements by z-order */}
  {sortedElements.map((element, index) => {
    if (element.type === "remotion") {
      return (
        <div style={{ zIndex: 50 + index }}>
          <RemotionPreview
            componentId={element.componentId}
            inputProps={element.props}
            width={previewWidth}
            height={previewHeight}
          />
        </div>
      );
    }
    // ... other element types
  })}

  {/* Layer N+1: Overlays */}
  <CaptionsDisplay />
  <StickersOverlay />
</div>
```

---

## Can We Render in Canvas?

### The Core Question

> Can we render Remotion components directly to QCut's Canvas 2D context instead of overlaying DOM?

### Short Answer: **Not Practically**

### Why Not?

| Feature | Remotion (React DOM) | Canvas 2D |
|---------|---------------------|-----------|
| **Text Rendering** | CSS fonts, line-height, letter-spacing | fillText() - limited styling |
| **Layout** | Flexbox, Grid, absolute positioning | Manual coordinate math |
| **Styling** | CSS properties (shadows, gradients, filters) | Limited API equivalents |
| **Animations** | spring(), interpolate() with CSS transforms | Manual implementation |
| **Components** | React component composition | Procedural drawing |
| **SVG** | Full SVG support | Must rasterize first |
| **Images** | `<Img>` with lazy loading | drawImage() |

### What We'd Lose

1. **CSS Layout Engine**
   - Remotion components use `<AbsoluteFill>`, flexbox, CSS transforms
   - Canvas has no layout engine - every position must be calculated manually

2. **React Component Model**
   - Remotion compositions are React components with props
   - Canvas is imperative - no component abstraction

3. **Text Rendering Quality**
   - DOM text uses browser's advanced text rendering
   - Canvas text is limited (no line-height, poor wrapping)

4. **Animation System**
   - `spring()` and `interpolate()` return CSS-compatible values
   - Would need to reimplement for canvas

### What Would Be Required

To render Remotion in Canvas, we'd need to:

```
1. Parse React component tree
2. Convert all CSS to canvas operations
3. Implement layout algorithm (flexbox, grid)
4. Implement text layout with wrapping
5. Convert spring/interpolate to canvas animations
6. Handle SVG rasterization
7. Maintain feature parity with @remotion/player
```

**This is essentially building a browser rendering engine.**

---

## Recommended Approach

### For Preview: DOM Overlay (Current Approach ✓)

```
┌─────────────────────────────────────────┐
│           Preview Container             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │     QCut Canvas (z-index: 1)    │    │
│  │     • Native elements           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Remotion Player (z-index: 2+)  │    │
│  │     • React DOM rendering       │    │
│  │     • CSS positioning           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Why this works:**
- Remotion renders exactly as designed
- No quality loss
- CSS handles scaling automatically
- Frame sync via seekTo() API

### For Export: Capture to Canvas

```
Export Frame N:
     │
     ├─► Render QCut native elements to canvas
     │
     ├─► For each Remotion element:
     │   ├─► Seek player to frame N
     │   ├─► Wait for render
     │   ├─► extractFrame() → ImageBitmap
     │   └─► drawImage(bitmap, x, y) on canvas
     │
     └─► Send canvas to FFmpeg encoder
```

**Implementation:**

```typescript
// player-wrapper.tsx - extractFrame method
extractFrame: async () => {
  const container = containerRef.current;
  if (!container) return null;

  // Remotion Player renders to an internal canvas
  const canvas = container.querySelector("canvas");
  if (canvas) {
    return await createImageBitmap(canvas);
  }

  // Fallback: use html2canvas for DOM capture
  const domCanvas = await html2canvas(container);
  return await createImageBitmap(domCanvas);
};
```

### Alternative: Pure Remotion Export

For highest quality, render entire project in Remotion:

```typescript
// Convert QCut timeline to Remotion composition
const QCutComposition = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Render QCut elements as Remotion components */}
      {qcutElements.map(element => (
        <QCutElementBridge element={element} frame={frame} />
      ))}

      {/* Render native Remotion elements */}
      {remotionElements.map(element => (
        <RemotionComponent {...element.props} />
      ))}
    </AbsoluteFill>
  );
};

// Export with @remotion/renderer
await renderMedia({
  composition: QCutComposition,
  codec: 'h264',
  outputLocation: 'output.mp4',
});
```

---

## Summary

| Approach | Preview | Export | Quality | Complexity |
|----------|---------|--------|---------|------------|
| **DOM Overlay** | ✅ Native | ❌ | Excellent | Low |
| **Canvas Capture** | ❌ | ✅ | Good | Medium |
| **Pure Remotion** | ✅ | ✅ | Excellent | High |
| **Rewrite in Canvas** | ❌ | ❌ | Poor | Extreme |

**Recommendation:**
- Keep DOM overlay for preview (current design)
- Use canvas capture for export
- Consider pure Remotion export for professional output

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [01-architecture.md](./01-architecture.md) | Dual rendering architecture |
| [TECHNICAL-CHALLENGES.md](./TECHNICAL-CHALLENGES.md) | Integration challenges |
| [04-export-engine.md](./04-export-engine.md) | Export pipeline details |

---

*This document explains why Remotion's DOM-based rendering cannot be easily replicated in Canvas 2D, and recommends the overlay approach instead.*
