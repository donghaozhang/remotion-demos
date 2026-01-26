# Technical Challenges: Integrating Remotion into QCut

> **Document Version:** 1.0.0
> **Last Updated:** 2026-01-25
> **Author:** Development Team

---

## Executive Summary

Integrating Remotion (a React-based video framework) into QCut (a canvas-based video editor) presents significant technical challenges due to fundamental architectural differences. This document explains the core issues, why they occur, and the solutions implemented.

---

## Table of Contents

1. [Architecture Comparison](#architecture-comparison)
2. [Core Technical Challenges](#core-technical-challenges)
3. [Challenge 1: Two Different Rendering Paradigms](#challenge-1-two-different-rendering-paradigms)
4. [Challenge 2: Composition vs Display Dimensions](#challenge-2-composition-vs-display-dimensions)
5. [Challenge 3: Async Player Initialization](#challenge-3-async-player-initialization)
6. [Challenge 4: Frame Synchronization](#challenge-4-frame-synchronization)
7. [Challenge 5: State Management Integration](#challenge-5-state-management-integration)
8. [Challenge 6: Export Pipeline Complexity](#challenge-6-export-pipeline-complexity)
9. [Lessons Learned](#lessons-learned)

---

## Architecture Comparison

### QCut's Native Architecture

QCut uses a **Canvas 2D rendering pipeline**:

```
┌─────────────────────────────────────────────────────────────┐
│                    QCut Rendering Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Timeline State (Zustand)                                  │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────┐    Direct pixel manipulation              │
│   │ Canvas 2D   │◄── • drawImage() for video/images         │
│   │ Context     │    • fillText() for text overlays         │
│   └─────────────┘    • Immediate mode rendering             │
│         │                                                   │
│         ▼                                                   │
│   Frame Buffer ──► FFmpeg WASM ──► Video File               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Immediate mode rendering (draw commands execute immediately)
- Direct pixel access via `getImageData()`/`putImageData()`
- Frame-by-frame control during export
- No virtual DOM overhead

### Remotion's Architecture

Remotion uses a **React DOM rendering pipeline**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Remotion Rendering Pipeline               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Frame Number (currentFrame)                               │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────┐    React reconciliation                   │
│   │ React       │◄── • useCurrentFrame() hook               │
│   │ Component   │    • Virtual DOM diffing                  │
│   └─────────────┘    • spring()/interpolate() animations    │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────┐    Browser rendering                      │
│   │ DOM/CSS/    │◄── • Layout calculation                   │
│   │ Canvas/SVG  │    • Paint operations                     │
│   └─────────────┘    • Compositing                          │
│         │                                                   │
│         ▼                                                   │
│   @remotion/renderer (Puppeteer) ──► Video File             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Retained mode rendering (React manages DOM state)
- Declarative animations tied to frame number
- Uses browser rendering engine for layout
- Requires headless browser for export

---

## Core Technical Challenges

| Challenge | Root Cause | Severity |
|-----------|------------|----------|
| Rendering Paradigm Mismatch | Canvas 2D vs React DOM | Critical |
| Dimension Confusion | Composition vs Display size | High |
| Async Initialization | React ref timing | High |
| Frame Sync | Different time models | Medium |
| State Integration | Separate store systems | Medium |
| Export Complexity | Different export pipelines | High |

---

## Challenge 1: Two Different Rendering Paradigms

### The Problem

QCut renders directly to a Canvas 2D context. Remotion renders React components to the DOM. These cannot be directly composited.

```
QCut Element:       Remotion Element:
┌──────────┐        ┌──────────┐
│ Canvas   │        │ React    │
│ 2D API   │   ≠    │ DOM      │
│ (pixels) │        │ (nodes)  │
└──────────┘        └──────────┘
     ↓                   ↓
  ImageData           HTML/CSS
```

### Why It's Challenging

1. **No Direct Pixel Access**: React components render to DOM, not pixels
2. **Async Rendering**: React's reconciliation is asynchronous
3. **Layout Dependencies**: Remotion components may use CSS layout features (flexbox, grid) that don't exist in Canvas

### The Solution

Use `@remotion/player` as a bridge:

```typescript
// The Player component renders Remotion to a contained DOM element
// which can then be captured or composited
<Player
  component={RemotionComponent}
  compositionWidth={1920}
  compositionHeight={1080}
  // ... props
/>
```

**File:** `src/lib/remotion/player-wrapper.tsx`

The Player internally uses an iframe or shadow DOM to isolate Remotion's rendering, then we can:
1. Let Remotion render to its container
2. Position the container within QCut's preview
3. For export, extract frames via canvas capture

---

## Challenge 2: Composition vs Display Dimensions

### The Problem

This was one of the most subtle bugs. Remotion's `<Player>` has two different dimension concepts:

| Prop | Purpose |
|------|---------|
| `compositionWidth/Height` | Internal coordinate system (1920×1080) |
| Container CSS `width/height` | Display size on screen (640×360) |

**Initial Bug:**
```typescript
// WRONG: Using preview dimensions for both
<Player
  compositionWidth={previewWidth}   // 640 - WRONG!
  compositionHeight={previewHeight}  // 360 - WRONG!
  style={{ width: previewWidth, height: previewHeight }}
/>
```

### Why It Broke

Remotion components use absolute positioning based on composition dimensions:

```typescript
// Lower Third component expects 1920×1080
const LowerThird = () => {
  return (
    <AbsoluteFill>
      <div style={{
        position: 'absolute',
        bottom: 80,  // 80px from bottom of 1080px
        left: 60,    // 60px from left of 1920px
      }}>
        {/* Content */}
      </div>
    </AbsoluteFill>
  );
};
```

When `compositionHeight` was set to 360 instead of 1080:
- `bottom: 80` puts the element at 280px from top (360 - 80)
- In a 1080p composition, it should be at 1000px from top
- The element appeared in the wrong position or outside the visible area

### The Fix

**File:** `src/lib/remotion/player-wrapper.tsx`

```typescript
// CORRECT: Use component's native dimensions for composition
const compositionWidth = component.width;   // 1920
const compositionHeight = component.height; // 1080

// Use props for display dimensions
const displayWidth = width ?? component.width;
const displayHeight = height ?? component.height;

<div style={{ width: displayWidth, height: displayHeight }}>
  <Player
    compositionWidth={compositionWidth}   // Always native (1920)
    compositionHeight={compositionHeight} // Always native (1080)
    style={{ width: '100%', height: '100%' }} // CSS handles scaling
  />
</div>
```

The Remotion Player internally handles the scaling transformation.

---

## Challenge 3: Async Player Initialization

### The Problem

React refs are set asynchronously after component mount. The code was checking for the ref too early:

```typescript
// BROKEN CODE
useEffect(() => {
  const player = playerRef.current;
  if (!player) return; // Returns immediately on first render!

  // This never runs because ref isn't set yet
  onReady?.();
}, [onReady]);
```

### Timeline of the Bug

```
T0: Component renders, useEffect queued
T1: useEffect runs, playerRef.current = null, exits early
T2: <Player> mounts, sets playerRef.current = PlayerInstance
T3: Nothing happens - effect doesn't re-run
    onReady() is never called
    isReady stays false forever
```

### The Fix

**File:** `src/lib/remotion/player-wrapper.tsx`

```typescript
// Track when player actually mounts
const [isPlayerMounted, setIsPlayerMounted] = useState(false);

// Effect to detect when ref becomes available
useEffect(() => {
  const checkRef = () => {
    if (playerRef.current && !isPlayerMounted) {
      setIsPlayerMounted(true);
    }
  };

  checkRef(); // Check immediately
  const timer = setTimeout(checkRef, 50); // Also check after delay

  return () => clearTimeout(timer);
}, [isPlayerMounted]);

// Now set up listeners only after mounted
useEffect(() => {
  if (!isPlayerMounted) return;

  const player = playerRef.current;
  if (!player) return;

  // Set up event listeners...
  onReady?.(); // Now this actually runs!
}, [isPlayerMounted, onReady]);
```

---

## Challenge 4: Frame Synchronization

### The Problem

QCut and Remotion have different time/frame models:

| Aspect | QCut | Remotion |
|--------|------|----------|
| Time unit | Seconds (float) | Frames (integer) |
| Playback | Continuous | Discrete frames |
| FPS | Variable | Fixed per composition |

### Synchronization Flow

```
QCut Timeline                    Remotion Player
     │                                │
     │ currentTime = 5.5s             │
     │                                │
     ├──── Convert to frame ──────────┤
     │     frame = floor(5.5 * 30)    │
     │     frame = 165                │
     │                                │
     │                    seekTo(165) │
     │                                │
     ▼                                ▼
Preview                          Render frame 165
```

### Implementation

**File:** `src/components/editor/preview-panel.tsx`

```typescript
if (element.type === "remotion") {
  const remotionElement = element as RemotionElement;

  // Calculate local time within element
  const elementStart = remotionElement.startTime + remotionElement.trimStart;
  const localTime = currentTime - elementStart;

  // Convert to frame number
  const fps = 30; // From component definition
  const currentFrame = Math.max(0, Math.floor(localTime * fps));

  // Pass to Remotion player for seeking
  return (
    <RemotionPreview
      currentFrame={currentFrame}
      // ...
    />
  );
}
```

---

## Challenge 5: State Management Integration

### The Problem

QCut uses multiple Zustand stores. Remotion components need their own state (registry, instances, cache). These must coordinate:

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
                        │  (unified view) │
                        └─────────────────┘
```

### Key Integration Points

**File:** `src/stores/remotion-store.ts`

```typescript
interface RemotionStore {
  // Component definitions (registered templates)
  registeredComponents: Map<string, RemotionComponentDefinition>;

  // Active instances (elements on timeline)
  instances: Map<string, RemotionInstance>;

  // Actions
  registerComponent: (def: RemotionComponentDefinition) => void;
  createInstance: (elementId: string, componentId: string, props: object) => void;
  destroyInstance: (elementId: string) => void;
}

// Initialize built-in components on store creation
initialize: () => {
  for (const definition of builtInComponentDefinitions) {
    newComponents.set(definition.id, definition);
  }
}
```

---

## Challenge 6: Export Pipeline Complexity

### The Problem

QCut's export uses FFmpeg WASM with direct canvas frames. Remotion export uses headless Chrome with `@remotion/renderer`. These cannot easily merge.

### Export Strategy Options

| Option | Pros | Cons |
|--------|------|------|
| A. Pre-render Remotion to frames | Simple composition | Double encoding, storage |
| B. Hybrid real-time | No pre-render | Complex synchronization |
| C. Pure Remotion export | Best quality | Requires Remotion CLI |

### Implemented Approach: Pre-render + Composite

```
Export Start
      │
      ▼
┌─────────────────────────────────┐
│ 1. Pre-render Remotion Elements │
│    • For each Remotion element  │
│    • Render frames to cache     │
│    • Store as PNG or in-memory  │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ 2. Main Export Loop             │
│    For each output frame:       │
│    • Render QCut native layers  │
│    • Load cached Remotion frame │
│    • Composite layers by z-order│
│    • Send to FFmpeg encoder     │
└─────────────────────────────────┘
      │
      ▼
Video File
```

**Files:**
- `src/lib/remotion/pre-renderer.ts` - Renders Remotion to frame cache
- `src/lib/remotion/compositor.ts` - Merges layers
- `src/lib/remotion/export-engine-remotion.ts` - Export orchestration

---

## Lessons Learned

### 1. Understand Both Coordinate Systems

Remotion uses **composition coordinates** (the video's native resolution) while the UI uses **display coordinates** (what fits on screen). Always keep these separate.

### 2. React Refs Are Async

Never assume a ref is set immediately. Use state tracking or callback refs to detect when components actually mount.

### 3. Bridge, Don't Replace

Rather than rewriting Remotion's rendering in Canvas, use the `@remotion/player` as a bridge. Let each system do what it's good at.

### 4. Test with Visible Components

When debugging rendering issues, use highly visible test components (bright colors, full-frame coverage) rather than subtle ones like Lower Thirds.

### 5. Log Everything During Development

Strategic console.log statements saved hours of debugging:

```typescript
console.log("[RemotionPreview] State:", {
  componentId,
  isReady,
  hasError,
  dimensions,
});
```

---

## Architecture Decision Records

### ADR-001: Use @remotion/player for Preview

**Decision:** Use the official `@remotion/player` package rather than custom rendering.

**Rationale:**
- Officially supported by Remotion team
- Handles React lifecycle correctly
- Provides imperative controls (play, pause, seekTo)
- Maintains compatibility with Remotion updates

### ADR-002: Separate Composition and Display Dimensions

**Decision:** Always use component's native dimensions for `compositionWidth/Height`.

**Rationale:**
- Ensures consistent positioning across all preview sizes
- Lets CSS handle display scaling
- Matches how Remotion Studio works

### ADR-003: Pre-render for Export

**Decision:** Pre-render Remotion elements to frame cache before main export.

**Rationale:**
- Decouples Remotion rendering from main timeline
- Allows parallel processing
- Simplifies the main export loop

---

## Related Documentation

| Document | Path |
|----------|------|
| Architecture Overview | `01-architecture.md` |
| Troubleshooting Guide | `TROUBLESHOOTING.md` |
| Implementation Plan | `IMPLEMENTATION-PLAN.md` |
| Remotion Renderer | `02-remotion-renderer.md` |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-25 | Initial technical challenges document |

---

*This document reflects hard-won knowledge from actual implementation. Update it as new challenges are discovered and solved.*
