# QCut-Remotion Integration: Troubleshooting Guide

> **Document Version:** 1.3.0
> **Last Updated:** 2026-01-25
> **Project Root:** `qcut/qcut/apps/web/src`

---

## Table of Contents

1. [Common Console Errors](#common-console-errors)
2. [Canvas2D Performance Fix - Subtasks](#canvas2d-performance-fix---subtasks)
3. [API Key Configuration](#api-key-configuration)
4. [Remotion Component Issues](#remotion-component-issues)
5. [Export Pipeline Issues](#export-pipeline-issues)
6. [Development Environment Setup](#development-environment-setup)

---

## Common Console Errors

### 1. FAL API Key Missing

**Error Message:**
```
[FalAIClient] ERROR: API_KEY_MISSING FAL API key not found at initialization.
Set VITE_FAL_API_KEY or configure it in Settings.
```

**Severity:** Warning (non-blocking for Remotion features)

**Source File:** `src/lib/fal-ai-client.ts`

**Cause:** The FAL.ai client requires an API key for AI video generation features. This is optional for basic Remotion functionality.

**Solution Options:**

| Option | Method | Steps |
|--------|--------|-------|
| A | Environment Variable | Add `VITE_FAL_API_KEY=your_key` to `.env` |
| B | QCut Settings UI | Settings → API Keys → Enter FAL API Key |
| C | Ignore | Safe to ignore if not using AI video features |

---

### 2. Canvas2D Performance Warnings

**Error Message:**
```
Canvas2D: Multiple readback operations using getImageData are faster with the
willReadFrequently attribute set to true.
```

**Severity:** Performance Warning

**Impact:** ~3x slower canvas operations during preview scrubbing and export

**Root Cause:** Canvas contexts created without the `willReadFrequently` optimization hint

---

## Canvas2D Performance Fix - Subtasks

### Overview

**Total Files to Update:** 12 files
**Estimated Time:** 20-30 minutes
**Priority:** Medium (Performance improvement)

### Subtask 1: Fix Remotion Integration Files (Critical Path)

These files are directly involved in Remotion rendering and export.

#### 1.1 Fix `compositor.ts` - tempCtx

**File:** `src/lib/remotion/compositor.ts`
**Line:** 131
**Import Path:** `@/lib/remotion/compositor`

```typescript
// BEFORE (line 131)
this.tempCtx = this.tempCanvas.getContext("2d");

// AFTER
this.tempCtx = this.tempCanvas.getContext("2d", {
  willReadFrequently: true,
});
```

**Note:** Line 123-124 already has `willReadFrequently: true` for `outputCtx`. Only `tempCtx` needs fixing.

---

#### 1.2 Fix `pre-renderer.ts`

**File:** `src/lib/remotion/pre-renderer.ts`
**Line:** 297
**Import Path:** `@/lib/remotion/pre-renderer`

```typescript
// BEFORE (line 297)
const ctx = canvas.getContext("2d");

// AFTER
const ctx = canvas.getContext("2d", {
  willReadFrequently: true,
});
```

**Function:** `captureFrameFromPlayer()`

---

#### 1.3 Fix `export-engine-remotion.ts`

**File:** `src/lib/remotion/export-engine-remotion.ts`
**Line:** 439
**Import Path:** `@/lib/remotion/export-engine-remotion`

```typescript
// BEFORE (line 439)
const ctx = this.canvas.getContext("2d");

// AFTER
const ctx = this.canvas.getContext("2d", {
  willReadFrequently: true,
});
```

**Function:** `compositeRemotionFrames()`

---

### Subtask 2: Fix Export Engine Files

These files handle video export and may perform frequent pixel reads.

#### 2.1 Fix `export-engine-factory.ts`

**File:** `src/lib/export-engine-factory.ts`
**Line:** 538
**Import Path:** `@/lib/export-engine-factory`

```typescript
// BEFORE (line 538)
const ctx = canvas.getContext("2d");

// AFTER
const ctx = canvas.getContext("2d", {
  willReadFrequently: true,
});
```

**Function:** Inside `createExportCanvas()` or similar

---

#### 2.2 Fix `export-engine-optimized.ts`

**File:** `src/lib/export-engine-optimized.ts`
**Line:** 76
**Import Path:** `@/lib/export-engine-optimized`

```typescript
// BEFORE (line 76)
this.offscreenCtx = this.offscreenCanvas.getContext("2d");

// AFTER
this.offscreenCtx = this.offscreenCanvas.getContext("2d", {
  willReadFrequently: true,
});
```

---

#### 2.3 Fix `webcodecs-export-engine.ts`

**File:** `src/lib/webcodecs-export-engine.ts`
**Line:** 117
**Import Path:** `@/lib/webcodecs-export-engine`

```typescript
// BEFORE (line 117)
this.offscreenCtx = this.offscreenCanvas.getContext("2d");

// AFTER
this.offscreenCtx = this.offscreenCanvas.getContext("2d", {
  willReadFrequently: true,
});
```

---

### Subtask 3: Fix Canvas Utility Files

#### 3.1 Fix `canvas-utils.ts` (2 locations)

**File:** `src/lib/canvas-utils.ts`
**Import Path:** `@/lib/canvas-utils`

**Location 1 - Line 58:**
```typescript
// BEFORE
const ctx = canvas.getContext("2d");

// AFTER
const ctx = canvas.getContext("2d", {
  willReadFrequently: true,
});
```

**Location 2 - Line 70:**
```typescript
// BEFORE
const fallbackCtx = fallbackCanvas.getContext("2d");

// AFTER
const fallbackCtx = fallbackCanvas.getContext("2d", {
  willReadFrequently: true,
});
```

---

#### 3.2 Fix `effects-canvas-advanced.ts` (2 locations)

**File:** `src/lib/effects-canvas-advanced.ts`
**Import Path:** `@/lib/effects-canvas-advanced`

**Location 1 - Line 83:**
```typescript
// BEFORE
const tempCtx = tempCanvas.getContext("2d");

// AFTER
const tempCtx = tempCanvas.getContext("2d", {
  willReadFrequently: true,
});
```

**Location 2 - Line 356:**
```typescript
// BEFORE
const toCtx = toCanvas.getContext("2d");

// AFTER
const toCtx = toCanvas.getContext("2d", {
  willReadFrequently: true,
});
```

---

### Subtask 4: Fix Editor Component Files

These are UI components that may perform canvas operations.

#### 4.1 Fix Drawing Canvas (`drawing-canvas.tsx`)

**File:** `src/components/editor/draw/canvas/drawing-canvas.tsx`
**Import Path:** `@/components/editor/draw/canvas/drawing-canvas`

**Lines to fix:** 165, 472, 473, 836, 900

```typescript
// All getContext("2d") calls should become:
canvas.getContext("2d", { willReadFrequently: true })
```

---

#### 4.2 Fix Canvas Utils (draw folder)

**File:** `src/components/editor/draw/utils/canvas-utils.ts`
**Import Path:** `@/components/editor/draw/utils/canvas-utils`

**Lines to fix:** 97, 142

---

#### 4.3 Fix use-canvas-drawing Hook

**File:** `src/components/editor/draw/hooks/use-canvas-drawing.ts`
**Import Path:** `@/components/editor/draw/hooks/use-canvas-drawing`

**Lines to fix:** 208, 271, 481

---

### Subtask 5: Fix Nano Edit & Segmentation Files

#### 5.1 Fix Nano Edit Files

| File | Lines | Import Path |
|------|-------|-------------|
| `src/components/editor/nano-edit/utils/fileUtils.ts` | 72, 118 | `@/components/editor/nano-edit/utils/fileUtils` |
| `src/components/editor/nano-edit/components/ResultDisplay.tsx` | 164 | `@/components/editor/nano-edit/components/ResultDisplay` |
| `src/components/editor/nano-edit/components/ImageEditorCanvas.tsx` | 34, 35 | `@/components/editor/nano-edit/components/ImageEditorCanvas` |
| `src/lib/utils/nano-edit-utils.ts` | 60, 106 | `@/lib/utils/nano-edit-utils` |

---

#### 5.2 Fix Segmentation Canvas

**File:** `src/components/editor/segmentation/SegmentationCanvas.tsx`
**Lines:** 124, 414
**Import Path:** `@/components/editor/segmentation/SegmentationCanvas`

---

### Subtask 6: Fix Store Files

#### 6.1 Fix Media Store

**File:** `src/stores/media-store.ts`
**Line:** 217
**Import Path:** `@/stores/media-store`

```typescript
// BEFORE (line 217)
const ctx = canvas.getContext("2d");

// AFTER
const ctx = canvas.getContext("2d", {
  willReadFrequently: true,
});
```

---

### Subtask 7: Add Unit Tests

**File to Create:** `src/lib/remotion/__tests__/canvas-optimization.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Canvas Optimization', () => {
  it('should create context with willReadFrequently option', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    expect(ctx).not.toBeNull();
  });

  it('should handle null canvas gracefully', () => {
    // Test error handling when context creation fails
  });
});
```

---

### Implementation Summary

| Priority | Subtask | Files | Est. Time |
|----------|---------|-------|-----------|
| **High** | 1. Remotion Integration | 3 files | 5 min |
| **High** | 2. Export Engines | 3 files | 5 min |
| **Medium** | 3. Canvas Utilities | 2 files | 5 min |
| **Medium** | 4. Editor Components | 3 files | 5 min |
| **Low** | 5. Nano Edit & Segmentation | 5 files | 5 min |
| **Low** | 6. Store Files | 1 file | 2 min |
| **Low** | 7. Unit Tests | 1 file | 3 min |

**Total:** 18 files, ~30 minutes

---

## API Key Configuration

### Supported API Keys

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| FAL.ai | `VITE_FAL_API_KEY` | AI video generation |
| Freesound | `VITE_FREESOUND_API_KEY` | Sound library |
| Gemini | `VITE_GEMINI_API_KEY` | AI transcription |

### Environment File Setup

**File:** `qcut/qcut/apps/web/.env`

```bash
# FAL.ai API Key (for AI video generation)
VITE_FAL_API_KEY=your_fal_api_key

# Freesound API Key (for sound library)
VITE_FREESOUND_API_KEY=your_freesound_api_key

# Google Gemini API Key (for AI transcription)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Electron Secure Storage

**Handler File:** `qcut/qcut/electron/api-key-handler.ts`

```typescript
// Retrieve keys
const keys = await window.electronAPI.apiKeys.get();

// Save keys
await window.electronAPI.apiKeys.save({
  falApiKey: 'your_key',
  freesoundApiKey: 'your_key',
  geminiApiKey: 'your_key'
});
```

---

## Remotion Component Issues

### Component Not Rendering

**Diagnostic Steps:**

1. **Check component registration:**

```typescript
// In browser console
import { useRemotionStore } from '@/stores/remotion-store';

const store = useRemotionStore.getState();
console.log('Registered:', Array.from(store.registeredComponents.keys()));
console.log('Initialized:', store.isInitialized);
```

2. **Check for errors:**

```typescript
const { recentErrors } = useRemotionStore.getState();
console.log('Errors:', recentErrors);
```

**Related Files:**

| File | Purpose | Import Path |
|------|---------|-------------|
| `src/stores/remotion-store.ts` | Component registry | `@/stores/remotion-store` |
| `src/lib/remotion/built-in/index.ts` | Built-in components | `@/lib/remotion/built-in` |
| `src/lib/remotion/types.ts` | Type definitions | `@/lib/remotion/types` |

---

### Skills Demo Not Appearing

If the Skills Demo component doesn't appear in the Remotion panel:

1. **Verify registration in store initialization:**

**File:** `src/stores/remotion-store.ts` (line ~70)

```typescript
// Should import built-in components
import { builtInComponentDefinitions } from "@/lib/remotion/built-in";

// In initialize():
for (const definition of builtInComponentDefinitions) {
  newComponents.set(definition.id, definition);
}
```

2. **Verify component export:**

**File:** `src/lib/remotion/built-in/templates/index.ts`

```typescript
// Should export SkillsDemo
export {
  SkillsDemo,
  SkillsDemoSchema,
  SkillsDemoDefinition,
  skillsDemoDefaultProps,
  type SkillsDemoProps,
} from "./skills-demo";

// Should be in definitions array
export const templateComponentDefinitions: RemotionComponentDefinition[] = [
  // ...other templates
  SkillsDemoDefinition,
];
```

---

### Remotion Elements Not Rendering in Preview Panel (FIXED)

**Issue:** Remotion elements on the timeline show black/empty in the main preview panel.

**Root Cause:** The `renderElement` function in `preview-panel.tsx` didn't handle `element.type === "remotion"`.

**Solution Implemented:** Added Remotion element rendering case to `preview-panel.tsx`.

**Files Modified:**

| File | Change |
|------|--------|
| `src/components/editor/preview-panel.tsx` | Added RemotionPreview import and rendering case |

**Implementation Details:**

```typescript
// Import added at top of file
import { RemotionPreview } from "./preview-panel/remotion-preview";
import type { RemotionElement } from "@/types/timeline";

// Rendering case added in renderElement function (around line 882)
if (element.type === "remotion") {
  const remotionElement = element as RemotionElement;
  return (
    <div key={elementKey} className="absolute inset-0" style={{ zIndex: 50 + index }}>
      <RemotionPreview
        elementId={remotionElement.id}
        componentId={remotionElement.componentId}
        inputProps={remotionElement.props}
        showControls={false}
        autoPlay={false}
        loop={false}
        maxWidth={previewDimensions.width}
        maxHeight={previewDimensions.height}
      />
    </div>
  );
}
```

**Status:** ✅ Fixed (2026-01-25)

---

### Remotion Component Rendering at Wrong Size/Position (FIXED)

**Issue:** Remotion components (e.g., Lower Third) render but appear misaligned or invisible because elements are positioned outside the visible area.

**Root Cause:** The `RemotionPlayerWrapper` was passing preview dimensions (e.g., 640x360) to both the container size AND the `compositionWidth`/`compositionHeight` props. However, Remotion components are designed for their native dimensions (e.g., 1920x1080). When a Lower Third positions itself at `bottom: 80px` in a 1080p composition but the composition is set to 360px tall, the element renders at the wrong position.

**Solution Implemented:** Modified `player-wrapper.tsx` to:
1. Always use the component's native dimensions for `compositionWidth`/`compositionHeight`
2. Use the container's display dimensions for the wrapper div
3. Let Remotion's Player handle the scaling via CSS

**File Modified:** `src/lib/remotion/player-wrapper.tsx`

**Code Changes:**

```typescript
// BEFORE - Used the same dimensions for both display and composition
const effectiveWidth = width ?? component.width;
const effectiveHeight = height ?? component.height;
// ...
compositionWidth={effectiveWidth}
compositionHeight={effectiveHeight}

// AFTER - Separate display and composition dimensions
// IMPORTANT: compositionWidth/Height must be the component's native dimensions
// for positioning/scaling to work correctly. The display size is controlled
// by the container and style props.
const compositionWidth = component.width;
const compositionHeight = component.height;
// Display dimensions - what size to render at
const displayWidth = width ?? component.width;
const displayHeight = height ?? component.height;
// ...
<div style={{ width: displayWidth, height: displayHeight }}>
  <Player
    compositionWidth={compositionWidth}
    compositionHeight={compositionHeight}
    style={{ width: "100%", height: "100%" }}
  />
</div>
```

**Key Insight:** Remotion's Player uses `compositionWidth`/`compositionHeight` to define the coordinate system of the composition, while the container's CSS dimensions control how the output is displayed. The Player's internal scaling handles the transformation correctly when these are separated.

**Status:** ✅ Fixed (2026-01-25)

---

## Export Pipeline Issues

### Pre-render Failures

**Error:**
```
RemotionExportEngine: Pre-render failed for element {id}
```

**Related Files:**

| File | Purpose | Import Path |
|------|---------|-------------|
| `src/lib/remotion/export-engine-remotion.ts` | Export pipeline | `@/lib/remotion/export-engine-remotion` |
| `src/lib/remotion/pre-renderer.ts` | Frame rendering | `@/lib/remotion/pre-renderer` |
| `src/lib/remotion/compositor.ts` | Layer compositing | `@/lib/remotion/compositor` |

**Debug Steps:**

```typescript
import { createPreRenderer } from '@/lib/remotion/pre-renderer';

const preRenderer = createPreRenderer('/tmp/debug', {
  width: 1920,
  height: 1080,
  fps: 30,
});

console.log('Render mode:', preRenderer.getRenderMode());
```

---

## Development Environment Setup

### Required Commands

```bash
# Install dependencies
cd qcut/qcut && bun install

# Setup FFmpeg
bun run setup-ffmpeg

# Development
bun run dev           # Vite dev server
bun run electron:dev  # Electron in dev mode

# Production build
bun run build
bun run electron

# Testing
bun run test
bun run test:watch
```

### Verify Remotion Installation

```bash
# Check Remotion packages
bun list | grep remotion

# Expected output:
# remotion
# @remotion/player
# @remotion/bundler
```

---

## Debugging Tips

### Enable Verbose Logging

**File:** `.env`

```bash
VITE_DEBUG_REMOTION=true
VITE_DEBUG_EXPORT=true
```

### Browser DevTools Filters

| Filter | Shows |
|--------|-------|
| `[Remotion]` | Remotion-specific logs |
| `[Export]` | Export pipeline logs |
| `[FalAI]` | AI client logs |
| `Canvas2D` | Canvas warnings |

### Collect Debug Info

```typescript
// Paste in browser console
const debugInfo = {
  remotionStore: useRemotionStore.getState(),
  timelineStore: useTimelineStore.getState(),
  components: Array.from(useRemotionStore.getState().registeredComponents.keys()),
  errors: useRemotionStore.getState().recentErrors,
};
console.log(JSON.stringify(debugInfo, null, 2));
```

---

## Related Documentation

| Document | Path |
|----------|------|
| Architecture | `docs/qcut-remotion-integration/01-architecture.md` |
| Implementation Plan | `docs/qcut-remotion-integration/IMPLEMENTATION-PLAN.md` |
| Component Bridge | `docs/qcut-remotion-integration/03-component-bridge.md` |
| Export Engine | `docs/qcut-remotion-integration/04-export-engine.md` |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.3.0 | 2026-01-25 | Fixed composition dimensions issue in player-wrapper.tsx |
| 1.2.0 | 2026-01-25 | Fixed Remotion elements not rendering in preview panel |
| 1.1.0 | 2026-01-25 | Added detailed subtasks with file paths and line numbers |
| 1.0.0 | 2026-01-25 | Initial troubleshooting guide |

---

*This document should be updated as new issues are discovered and resolved.*
