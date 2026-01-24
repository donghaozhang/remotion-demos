# QCut-Remotion Integration: Detailed Implementation Plan

> Generated from: `05-implementation-phases.md`
> Date: 2026-01-24
> Project Root: `C:\Users\zdhpe\Desktop\remotion\qcut\qcut\apps\web\src`

---

## Table of Contents

1. [Phase 1: Foundation](#phase-1-foundation)
2. [Phase 2: Timeline Integration](#phase-2-timeline-integration)
3. [Phase 3: Properties Panel](#phase-3-properties-panel)
4. [Phase 4: Export Pipeline](#phase-4-export-pipeline)
5. [Phase 5: Component Library](#phase-5-component-library)
6. [Phase 6: Polish & Testing](#phase-6-polish--testing)

---

## Phase 1: Foundation

**Goal:** Get Remotion Player running inside QCut

### Task 1.1: Add Remotion Dependencies

**Description:** Install and configure Remotion packages in QCut workspace

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `qcut/qcut/apps/web/package.json` |
| MODIFY | `qcut/qcut/pnpm-lock.yaml` |

**Implementation Steps:**
1. Add dependencies to `package.json`:
   ```json
   {
     "@remotion/player": "^4.0.0",
     "@remotion/bundler": "^4.0.0",
     "@remotion/renderer": "^4.0.0",
     "remotion": "^4.0.0"
   }
   ```
2. Run `pnpm install` to update lock file
3. Verify no version conflicts with existing React version

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| N/A | Dependency installation - manual verification |

---

### Task 1.2: Create Remotion Type Definitions

**Description:** Define TypeScript interfaces for Remotion integration

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/types.ts` |

**Implementation:**
```typescript
// src/lib/remotion/types.ts

import type { PlayerRef } from '@remotion/player';
import type { ZodSchema } from 'zod';

export interface RemotionComponentDefinition {
  id: string;
  name: string;
  category: 'animation' | 'scene' | 'effect' | 'template';
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  schema: ZodSchema;
  defaultProps: Record<string, unknown>;
  thumbnail?: string;
  component: React.FC<any>;
}

export interface RemotionElementData {
  componentId: string;
  componentPath?: string;
  props: Record<string, unknown>;
  renderMode: 'live' | 'cached';
}

export interface RemotionInstance {
  elementId: string;
  componentId: string;
  playerRef: PlayerRef | null;
  localFrame: number;
  props: Record<string, unknown>;
  cacheStatus: 'none' | 'partial' | 'complete';
}

export interface FrameCacheEntry {
  frame: number;
  imageData: ImageBitmap;
  timestamp: number;
}

export interface RenderJob {
  elementId: string;
  startFrame: number;
  endFrame: number;
  priority: number;
  status: 'pending' | 'rendering' | 'complete' | 'error';
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/types.test.ts` | Type validation and schema tests |

---

### Task 1.3: Create Remotion Zustand Store

**Description:** Create state management store for Remotion components

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/stores/remotion-store.ts` |

**Dependencies:**
- `src/lib/remotion/types.ts` (Task 1.2)
- `zustand` (existing dependency)

**Implementation Details:**
```typescript
// Store interface
interface RemotionStore {
  // State
  registeredComponents: Map<string, RemotionComponentDefinition>;
  instances: Map<string, RemotionInstance>;
  frameCache: Map<string, FrameCacheEntry[]>;
  renderQueue: RenderJob[];

  // Actions
  registerComponent: (def: RemotionComponentDefinition) => void;
  unregisterComponent: (id: string) => void;
  createInstance: (elementId: string, componentId: string, props: object) => void;
  destroyInstance: (elementId: string) => void;
  updateInstanceProps: (elementId: string, props: object) => void;
  seekInstance: (elementId: string, frame: number) => void;
  getCachedFrame: (elementId: string, frame: number) => ImageBitmap | null;
  cacheFrame: (elementId: string, frame: number, data: ImageBitmap) => void;
  clearCache: (elementId?: string) => void;
  addRenderJob: (job: RenderJob) => void;
  updateRenderJobStatus: (elementId: string, status: RenderJob['status']) => void;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/stores/__tests__/remotion-store.test.ts` | Store actions, state mutations, cache management |

---

### Task 1.4: Create RemotionPlayerWrapper Component

**Description:** Wrap @remotion/player with QCut-compatible controls

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/player-wrapper.tsx` |

**Dependencies:**
- `@remotion/player`
- `src/stores/remotion-store.ts` (Task 1.3)
- `src/lib/remotion/types.ts` (Task 1.2)

**Implementation Details:**
```tsx
// Component interface
interface RemotionPlayerWrapperProps {
  componentId: string;
  elementId: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  inputProps: Record<string, unknown>;
  currentFrame: number;
  isPlaying: boolean;
  onFrameUpdate?: (frame: number) => void;
  onError?: (error: Error) => void;
}
```

Key features:
- Match QCut's video dimensions (1920x1080)
- Expose imperative controls via ref (play, pause, seekTo)
- Handle frame synchronization with QCut timeline
- Extract frames to canvas for compositing

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/player-wrapper.test.tsx` | Render, seek, play/pause, frame extraction |

---

### Task 1.5: Create Remotion Preview Panel Component

**Description:** Add Remotion preview tab in QCut's preview area

**Files to Create/Modify:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/preview-panel/remotion-preview.tsx` |
| MODIFY | `src/components/editor/preview-panel.tsx` |

**Dependencies:**
- `src/lib/remotion/player-wrapper.tsx` (Task 1.4)
- `src/stores/remotion-store.ts` (Task 1.3)
- `src/stores/timeline-store.ts` (existing)

**Implementation Details:**
- New tab "Remotion" in preview panel tabbar
- Load sample composition on mount
- Basic playback controls (play, pause, seek slider)
- Frame counter display
- Error boundary for component failures

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/preview-panel/__tests__/remotion-preview.test.tsx` | Tab switching, playback controls, error handling |

---

### Phase 1 Success Criteria Checklist

- [x] Remotion dependencies installed without conflicts
- [x] Type definitions compile without errors
- [x] Remotion store initializes correctly
- [x] Player wrapper renders in QCut
- [x] Sample Remotion composition plays
- [x] Player responds to external seek commands

---

## Phase 2: Timeline Integration

**Goal:** Add Remotion elements to QCut timeline

### Task 2.1: Extend Timeline Types for Remotion

**Description:** Add RemotionElement type to timeline type system

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/types/timeline.ts` |
| MODIFY | `src/stores/media-store-types.ts` |

**Implementation Details:**

Add to `src/types/timeline.ts`:
```typescript
// Extend TrackType
export type TrackType = 'media' | 'text' | 'audio' | 'sticker' | 'captions' | 'remotion';

// New element type
export interface RemotionElement {
  id: string;
  type: 'remotion';
  trackId: string;
  start: number;           // Frame number
  duration: number;        // Frame count
  componentId: string;     // Reference to Remotion composition
  componentPath?: string;  // Optional path to .tsx file
  props: Record<string, unknown>;
  renderMode: 'live' | 'cached';

  // Transform properties (shared with other elements)
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  opacity?: number;

  // Effects (applied post-Remotion render)
  effects?: Effect[];
}

// Update TimelineElement union
export type TimelineElement =
  | MediaElement
  | TextElement
  | StickerElement
  | CaptionElement
  | RemotionElement;
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/types/__tests__/timeline.test.ts` | Type guards, element creation, validation |

---

### Task 2.2: Update Timeline Store for Remotion Elements

**Description:** Add Remotion element CRUD operations to timeline store

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/stores/timeline-store.ts` |
| MODIFY | `src/stores/timeline/element-operations.ts` |
| MODIFY | `src/stores/timeline/types.ts` |

**Implementation Details:**

Add to timeline store:
```typescript
// New actions
addRemotionElement: (
  trackId: string,
  componentId: string,
  startFrame: number,
  props?: Record<string, unknown>
) => string;

updateRemotionProps: (
  elementId: string,
  props: Record<string, unknown>
) => void;

// Modify existing actions to handle RemotionElement
// - moveElement
// - resizeElement
// - deleteElement
// - duplicateElement
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/stores/__tests__/timeline-store.remotion.test.ts` | Add/update/delete Remotion elements |
| `src/stores/timeline/__tests__/element-operations.remotion.test.ts` | Element operations for Remotion type |

---

### Task 2.3: Create Timeline Remotion Element Renderer

**Description:** Visual representation of Remotion elements on timeline

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/timeline/remotion-element.tsx` |
| MODIFY | `src/components/editor/timeline/timeline-element.tsx` |

**Dependencies:**
- `src/stores/remotion-store.ts` (Phase 1)
- `src/types/timeline.ts` (Task 2.1)

**Implementation Details:**
```tsx
interface RemotionTimelineElementProps {
  element: RemotionElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onResize: (delta: number, edge: 'start' | 'end') => void;
}

// Visual features:
// - Purple/blue gradient background (distinct from other elements)
// - Component name label
// - Thumbnail preview from component
// - Duration handles (resize)
// - Cached indicator (icon showing render status)
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/timeline/__tests__/remotion-element.test.tsx` | Render, selection, resize handles |

---

### Task 2.4: Create Remotion Component Picker

**Description:** UI for adding Remotion components to timeline

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/media-panel/remotion-picker.tsx` |
| MODIFY | `src/components/editor/media-panel/index.tsx` |
| MODIFY | `src/components/editor/media-panel/tabbar.tsx` |

**Implementation Details:**
- New tab "Remotion" in media panel tabbar
- Grid of available components with thumbnails
- Category filtering (animation, scene, effect, template)
- Search functionality
- Click to insert at playhead position
- Drag to specific timeline position

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/media-panel/__tests__/remotion-picker.test.tsx` | Component listing, filtering, insertion |

---

### Task 2.5: Create Playback Sync Manager

**Description:** Synchronize QCut playback with Remotion players

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/sync-manager.ts` |

**Dependencies:**
- `src/stores/timeline-store.ts` (existing)
- `src/stores/remotion-store.ts` (Phase 1)
- `src/stores/playback-store.ts` (existing)

**Implementation Details:**
```typescript
interface SyncManager {
  // Frame translation
  globalToLocal: (globalFrame: number, element: RemotionElement) => number;
  localToGlobal: (localFrame: number, element: RemotionElement) => number;

  // Active element detection
  getActiveElements: (globalFrame: number) => RemotionElement[];

  // Sync operations
  syncToGlobalFrame: (frame: number) => void;
  syncPlayState: (isPlaying: boolean) => void;
  syncPlaybackRate: (rate: number) => void;

  // Event handlers
  onTimelineSeek: (frame: number) => void;
  onTimelinePlay: () => void;
  onTimelinePause: () => void;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/sync-manager.test.ts` | Frame translation, active detection, sync operations |

---

### Phase 2 Success Criteria Checklist

- [x] Remotion elements appear on timeline
- [x] Elements can be moved along timeline
- [x] Elements can be resized (duration change)
- [x] Scrubbing updates Remotion preview
- [x] Multiple Remotion elements supported
- [x] Elements respect z-order based on tracks

---

## Phase 3: Properties Panel

**Goal:** Edit Remotion component props in QCut

### Task 3.1: Create Zod Schema Parser

**Description:** Parse Remotion component schemas to generate form fields

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/schema-parser.ts` |

**Implementation Details:**
```typescript
interface ParsedField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'object' | 'array';
  label: string;
  description?: string;
  defaultValue: unknown;
  validation: {
    required: boolean;
    min?: number;
    max?: number;
    options?: { label: string; value: unknown }[];
  };
}

interface SchemaParser {
  parse: (schema: ZodSchema) => ParsedField[];
  validate: (schema: ZodSchema, values: object) => ValidationResult;
  getDefaultValues: (schema: ZodSchema) => object;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/schema-parser.test.ts` | Various Zod schema types, nested objects, validation |

---

### Task 3.2: Create Prop Editor Components

**Description:** Individual input components for different prop types

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/properties-panel/prop-editors/index.ts` |
| CREATE | `src/components/editor/properties-panel/prop-editors/text-prop.tsx` |
| CREATE | `src/components/editor/properties-panel/prop-editors/number-prop.tsx` |
| CREATE | `src/components/editor/properties-panel/prop-editors/color-prop.tsx` |
| CREATE | `src/components/editor/properties-panel/prop-editors/select-prop.tsx` |
| CREATE | `src/components/editor/properties-panel/prop-editors/boolean-prop.tsx` |

**Implementation Details:**

Each editor receives:
```typescript
interface PropEditorProps<T> {
  name: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  validation?: ParsedField['validation'];
  error?: string;
}
```

Specific editors:
- **TextProp**: Single/multi-line text input with character count
- **NumberProp**: Slider + input with min/max/step
- **ColorProp**: Color picker with hex/rgb input
- **SelectProp**: Dropdown with options
- **BooleanProp**: Toggle switch

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/properties-panel/prop-editors/__tests__/text-prop.test.tsx` | Input, validation, change handling |
| `src/components/editor/properties-panel/prop-editors/__tests__/number-prop.test.tsx` | Slider, bounds, step |
| `src/components/editor/properties-panel/prop-editors/__tests__/color-prop.test.tsx` | Color formats, picker |
| `src/components/editor/properties-panel/prop-editors/__tests__/select-prop.test.tsx` | Options, selection |
| `src/components/editor/properties-panel/prop-editors/__tests__/boolean-prop.test.tsx` | Toggle state |

---

### Task 3.3: Create Remotion Properties Panel

**Description:** Main panel for editing selected Remotion element

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/properties-panel/remotion-properties.tsx` |
| MODIFY | `src/components/editor/properties-panel/index.tsx` |

**Dependencies:**
- `src/lib/remotion/schema-parser.ts` (Task 3.1)
- `src/components/editor/properties-panel/prop-editors/*` (Task 3.2)
- `src/stores/remotion-store.ts` (Phase 1)

**Implementation Details:**
```tsx
interface RemotionPropertiesProps {
  element: RemotionElement;
  onPropsChange: (props: Record<string, unknown>) => void;
}

// Features:
// - Component name and info header
// - Auto-generated form from Zod schema
// - Live preview on change (debounced)
// - Reset to defaults button
// - Validation error display
// - Collapsible sections for complex props
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/properties-panel/__tests__/remotion-properties.test.tsx` | Form generation, live update, validation |

---

### Task 3.4: Create Keyframe Editor for Remotion Props

**Description:** Animate Remotion props over time with keyframes

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/properties-panel/keyframe-editor.tsx` |
| CREATE | `src/lib/remotion/keyframe-converter.ts` |

**Implementation Details:**

Keyframe Editor UI:
```tsx
interface KeyframeEditorProps {
  propName: string;
  propType: 'number' | 'color';
  keyframes: Keyframe[];
  duration: number;
  onKeyframeAdd: (frame: number, value: unknown) => void;
  onKeyframeUpdate: (id: string, frame: number, value: unknown) => void;
  onKeyframeDelete: (id: string) => void;
}

interface Keyframe {
  id: string;
  frame: number;
  value: unknown;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';
}
```

Keyframe Converter:
```typescript
// Convert QCut keyframes to Remotion interpolate() calls
function convertToRemotionInterpolate(keyframes: Keyframe[]): string;
function generateAnimatedProp(keyframes: Keyframe[]): (frame: number) => unknown;
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/properties-panel/__tests__/keyframe-editor.test.tsx` | Add/move/delete keyframes |
| `src/lib/remotion/__tests__/keyframe-converter.test.ts` | Interpolation generation |

---

### Phase 3 Success Criteria Checklist

- [x] Props panel shows component properties
- [x] Editing props updates preview in real-time
- [x] Schema validation prevents invalid values
- [x] All basic prop types have editors
- [x] Basic keyframe animation works

---

## Phase 4: Export Pipeline

**Goal:** Export videos with mixed QCut + Remotion content

### Task 4.1: Create Remotion Pre-renderer ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Render Remotion elements to frame sequences before final export

**Files Created:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/pre-renderer.ts` |
| CREATE | `src/lib/remotion/__tests__/pre-renderer.test.ts` |

**Dependencies:**
- `@remotion/renderer`
- `src/stores/remotion-store.ts` (Phase 1)
- `src/types/timeline.ts` (Phase 2)

**Implementation Details:**
```typescript
interface PreRenderConfig {
  outputDir: string;
  format: 'png' | 'jpeg';
  quality: number;           // 0-100 for JPEG
  concurrency: number;       // Parallel render threads
  scale: number;             // Resolution scale
}

interface PreRenderResult {
  elementId: string;
  framePaths: Map<number, string>;
  audioPath?: string;
  success: boolean;
  error?: Error;
}

interface PreRenderer {
  preRenderElement: (
    element: RemotionElement,
    config: PreRenderConfig,
    onProgress: (progress: number) => void
  ) => Promise<PreRenderResult>;

  preRenderAll: (
    elements: RemotionElement[],
    config: PreRenderConfig,
    onProgress: (elementId: string, progress: number) => void
  ) => Promise<PreRenderResult[]>;

  cleanup: (sessionId: string) => Promise<void>;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/pre-renderer.test.ts` | Frame rendering, concurrency, error handling |

---

### Task 4.2: Create Frame Compositor ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Merge QCut canvas with pre-rendered Remotion frames

**Files Created:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/compositor.ts` |
| CREATE | `src/lib/remotion/__tests__/compositor.test.ts` |

**Dependencies:**
- `src/lib/remotion/pre-renderer.ts` (Task 4.1)

**Implementation Details:**
```typescript
interface CompositeLayer {
  zIndex: number;
  source: 'qcut' | 'remotion';
  elementId: string;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';
  opacity: number;
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  mask?: ImageData;
}

interface Compositor {
  compositeFrame: (
    qcutCanvas: HTMLCanvasElement,
    remotionFrames: Map<string, ImageBitmap>,
    layers: CompositeLayer[],
    outputCanvas: HTMLCanvasElement
  ) => void;

  computeLayerOrder: (elements: TimelineElement[], frame: number) => CompositeLayer[];
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/compositor.test.ts` | Layer ordering, blending, alpha compositing |

---

### Task 4.3: Modify Export Engine for Remotion ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Integrate Remotion pre-rendering into export pipeline

**Files Modified/Created:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/lib/export-engine-factory.ts` |
| CREATE | `src/lib/remotion/export-engine-remotion.ts` |
| CREATE | `src/lib/remotion/__tests__/export-engine-remotion.test.ts` |

**Dependencies:**
- `src/lib/remotion/pre-renderer.ts` (Task 4.1)
- `src/lib/remotion/compositor.ts` (Task 4.2)

**Implementation Details:**

New export phases:
```typescript
type ExportPhase =
  | 'analyzing'      // Detect Remotion elements
  | 'prerendering'   // Pre-render Remotion to frames
  | 'compositing'    // Merge QCut + Remotion frames
  | 'encoding'       // Final video encoding
  | 'cleanup';       // Remove temp files

interface RemotionExportEngine {
  export: (
    timeline: TimelineState,
    settings: ExportSettings,
    onProgress: (phase: ExportPhase, progress: number) => void
  ) => Promise<ExportResult>;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/__tests__/export-engine-remotion.test.ts` | Full export pipeline with Remotion elements |

---

### Task 4.4: Update Audio Mixer for Remotion ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Extract and mix Remotion audio with QCut audio

**Files Modified/Created:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/lib/audio-mixer.ts` |
| CREATE | `src/lib/__tests__/audio-mixer.remotion.test.ts` |

**Implementation Details:**
```typescript
interface RemotionAudioSource {
  elementId: string;
  audioPath: string;
  startFrame: number;
  durationFrames: number;
  volume: number;
}

// Add to existing AudioMixer:
mixRemotionAudio: (
  sources: RemotionAudioSource[],
  fps: number
) => Promise<AudioBuffer>;
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/__tests__/audio-mixer.remotion.test.ts` | Remotion audio extraction, timing sync, mixing |

---

### Task 4.5: Update Export UI for Remotion Progress ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Show pre-render progress in export dialog

**Files Modified/Created:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/stores/export-store.ts` |
| CREATE | `src/components/export/remotion-export-progress.tsx` |
| CREATE | `src/components/export/__tests__/remotion-export-progress.test.tsx` |

**Implementation Details:**
- Added `RemotionExportProgress` type to store with phase tracking
- Added `RemotionElementProgress` for per-element progress
- Created `RemotionExportProgress` component with:
  - Phase indicators (analyzing, prerendering, compositing, encoding, cleanup)
  - Per-element progress bars during pre-render
  - Error display for Remotion render failures
  - Option to skip failed elements
  - Collapsible element list
  - Estimated time remaining

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/export/__tests__/remotion-export-progress.test.tsx` | Phase display, element progress, error handling, skip functionality |

---

### Phase 4 Success Criteria Checklist

- [x] Export works with Remotion elements (RemotionExportEngine)
- [x] Pre-render progress displayed accurately (RemotionExportProgress component)
- [x] Video quality matches source Remotion components (compositor with blend modes)
- [x] Audio from Remotion elements properly mixed (RemotionAudioMixer)
- [x] Error recovery for failed Remotion renders (skip failed elements feature)

**Phase 4 Status: ✅ COMPLETED**

All 5 tasks completed with 235+ tests passing.

---

## Phase 5: Component Library

**Goal:** Provide built-in Remotion templates

### Task 5.1: Create Built-in Text Animation Components ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Starter pack of text animation components

**Files Created:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/built-in/text/index.ts` |
| CREATE | `src/lib/remotion/built-in/text/typewriter.tsx` |
| CREATE | `src/lib/remotion/built-in/text/fade-in-text.tsx` |
| CREATE | `src/lib/remotion/built-in/text/bounce-text.tsx` |
| CREATE | `src/lib/remotion/built-in/text/slide-text.tsx` |
| CREATE | `src/lib/remotion/built-in/text/scale-text.tsx` |
| CREATE | `src/lib/remotion/built-in/index.ts` |

**Each component includes:**
- React component with Remotion primitives (useCurrentFrame, spring, interpolate)
- Zod schema for props validation
- Default props
- Component metadata (name, category, duration, tags, version)
- Multiple animation modes (all, word, character)

**Components Created:**
1. **Typewriter** - Character-by-character text reveal with blinking cursor
2. **FadeInText** - Opacity fade with optional word/character stagger and slide-up
3. **BounceText** - Spring-based bounce animation from any direction
4. **SlideText** - Slide in from left/right/top/bottom with multiple easing options
5. **ScaleText** - Zoom/pop/grow/shrink animations with optional rotation

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/built-in/text/__tests__/typewriter.test.tsx` | 27 tests for schema, rendering, animation |
| `src/lib/remotion/built-in/text/__tests__/fade-in-text.test.tsx` | 28 tests for fade modes, easing |
| `src/lib/remotion/built-in/text/__tests__/text-components.test.tsx` | 62 tests for bounce, slide, scale, and index exports |

**Total: 117 tests passing**

---

### Task 5.2: Create Built-in Transition Components ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Transition effects for scene changes

**Files Created:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/built-in/transitions/index.ts` |
| CREATE | `src/lib/remotion/built-in/transitions/wipe.tsx` |
| CREATE | `src/lib/remotion/built-in/transitions/dissolve.tsx` |
| CREATE | `src/lib/remotion/built-in/transitions/slide.tsx` |
| CREATE | `src/lib/remotion/built-in/transitions/zoom.tsx` |

**Components Created:**
1. **Wipe** - Directional wipe (left/right/up/down) with optional soft edge
2. **Dissolve** - Cross-fade with fade/additive/dither styles
3. **Slide** - Push/slide transition with spring/bounce options
4. **Zoom** - Zoom in/out/through with configurable origin point

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/built-in/transitions/__tests__/transitions.test.tsx` | 61 tests for all transitions |

---

### Task 5.3: Create Built-in Template Components ✅ COMPLETED

**Status:** Implemented on 2026-01-24

**Description:** Common video templates (lower thirds, intros, outros)

**Files Created:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/built-in/templates/index.ts` |
| CREATE | `src/lib/remotion/built-in/templates/lower-third.tsx` |
| CREATE | `src/lib/remotion/built-in/templates/intro-scene.tsx` |
| CREATE | `src/lib/remotion/built-in/templates/outro-scene.tsx` |
| CREATE | `src/lib/remotion/built-in/templates/title-card.tsx` |

**Components Created:**
1. **LowerThird** - Professional lower third overlay for names/titles with slide/fade/expand/typewriter animations
2. **TitleCard** - Full-screen title card for chapters with fade/scale/slide/blur animations
3. **IntroScene** - Video intro with logo, title, tagline and particle effects (elegant/energetic/minimal/dramatic styles)
4. **OutroScene** - Video outro with CTA, subscribe button, video placeholders and social icons (centered/split/bottom-heavy layouts)

**Each component includes:**
- React component with Remotion primitives (useCurrentFrame, spring, interpolate)
- Zod schema for props validation
- Default props
- Component metadata (name, category, duration, tags, version)
- Multiple animation styles/layouts

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/built-in/templates/__tests__/templates.test.tsx` | 82 tests for all templates |

**Total: 82 tests passing**

---

### Task 5.4: Create Component Browser UI

**Description:** Browse and search available Remotion components

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/components/editor/media-panel/component-browser.tsx` |
| CREATE | `src/components/editor/media-panel/component-card.tsx` |
| CREATE | `src/components/editor/media-panel/component-preview-modal.tsx` |

**Implementation Details:**
```tsx
interface ComponentBrowserProps {
  onSelect: (componentId: string) => void;
}

// Features:
// - Category tabs (All, Text, Transitions, Templates, Imported)
// - Search by name
// - Thumbnail grid view
// - Preview modal on hover/click
// - Favorites system
// - Recently used section
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/media-panel/__tests__/component-browser.test.tsx` | Filtering, search, selection |

---

### Task 5.5: Create Component Import System

**Description:** Import custom Remotion components from .tsx files

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/component-loader.ts` |
| CREATE | `src/lib/remotion/component-validator.ts` |
| CREATE | `src/components/editor/media-panel/component-import-dialog.tsx` |

**Implementation Details:**

Component Validator:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ComponentMetadata;
}

function validateComponent(code: string): ValidationResult;
// Checks:
// - Valid React component export
// - No forbidden APIs (fs, network, etc.)
// - Has required metadata (schema, defaultProps)
// - Reasonable resource usage
```

Component Loader:
```typescript
function loadComponent(
  filePath: string,
  sandbox: boolean
): Promise<RemotionComponentDefinition>;
// Features:
// - Dynamic import with sandboxing
// - Metadata extraction
// - Thumbnail generation
// - Store in IndexedDB
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/component-loader.test.ts` | Import, validation, storage |
| `src/lib/remotion/__tests__/component-validator.test.ts` | Security checks, API blocking |

---

### Phase 5 Success Criteria Checklist

- [x] 10+ built-in components available (13 components: 5 text + 4 transitions + 4 templates)
- [ ] Component browser shows all components with thumbnails
- [ ] Search and filtering work correctly
- [ ] Custom component import works
- [ ] Validation catches dangerous patterns
- [ ] Components properly stored in IndexedDB

**Phase 5 Progress:**
- Task 5.1: ✅ COMPLETED (5 text animation components, 117 tests)
- Task 5.2: ✅ COMPLETED (4 transition components, 61 tests)
- Task 5.3: ✅ COMPLETED (4 template components, 82 tests)
- Task 5.4: ⏳ Pending (Component Browser UI)
- Task 5.5: ⏳ Pending (Component Import System)

**Total Built-in Components Tests: 260 passing**

---

## Phase 6: Polish & Testing

**Goal:** Optimize performance, improve UX, complete documentation and testing

### Task 6.1: Implement Frame Caching (LRU)

**Description:** Cache rendered Remotion frames to improve scrubbing performance

**Files to Create/Modify:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/frame-cache.ts` |
| MODIFY | `src/stores/remotion-store.ts` |

**Implementation Details:**
```typescript
interface LRUFrameCache {
  maxSizeBytes: number;
  currentSizeBytes: number;
  entries: Map<string, CacheEntry>;

  get: (key: string) => ImageBitmap | null;
  set: (key: string, frame: ImageBitmap) => void;
  evict: (bytesToFree: number) => void;
  clear: () => void;
  getStats: () => CacheStats;
}

// Cache key format: `${elementId}-${frame}-${propsHash}`
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/frame-cache.test.ts` | LRU eviction, size limits, hit/miss |

---

### Task 6.2: Implement Lazy Component Loading

**Description:** Load Remotion components only when needed

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/lib/remotion/component-loader.ts` |
| MODIFY | `src/stores/remotion-store.ts` |

**Implementation Details:**
- Components loaded on first use, not at startup
- Loading indicator while component initializes
- Preload components visible in viewport
- Unload unused components after timeout

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/component-loader.lazy.test.ts` | Lazy loading, preloading, unloading |

---

### Task 6.3: Implement Worker Thread Rendering

**Description:** Offload Remotion rendering to Web Worker

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/render-worker.ts` |
| CREATE | `src/lib/remotion/render-worker.worker.ts` |

**Implementation Details:**
```typescript
interface RenderWorkerMessage {
  type: 'render' | 'cancel' | 'clear-cache';
  payload: {
    componentId: string;
    frame: number;
    props: object;
  };
}

interface RenderWorkerResponse {
  type: 'frame' | 'error' | 'progress';
  payload: ImageBitmap | Error | number;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/render-worker.test.ts` | Worker communication, cancellation |

---

### Task 6.4: Add Drag-Drop to Timeline

**Description:** Drag Remotion components from browser directly to timeline

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/components/editor/timeline/index.tsx` |
| MODIFY | `src/components/editor/media-panel/component-browser.tsx` |
| MODIFY | `src/components/editor/timeline/timeline-element-drop-zone.tsx` |

**Implementation Details:**
- Draggable component cards in browser
- Drop zone highlighting on timeline
- Snap to playhead or existing elements
- Visual feedback during drag

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/components/editor/timeline/__tests__/drag-drop.remotion.test.tsx` | Drag, drop, positioning |

---

### Task 6.5: Add Keyboard Shortcuts

**Description:** Keyboard shortcuts for Remotion operations

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/stores/keybindings-store.ts` |
| MODIFY | `src/constants/actions.ts` |

**New Shortcuts:**
| Action | Shortcut | Description |
|--------|----------|-------------|
| `remotion.addComponent` | `Shift+R` | Open component browser |
| `remotion.refreshPreview` | `Shift+F5` | Force refresh Remotion preview |
| `remotion.clearCache` | `Ctrl+Shift+C` | Clear Remotion frame cache |

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/stores/__tests__/keybindings-store.remotion.test.ts` | Shortcut registration, execution |

---

### Task 6.6: Add Undo/Redo Support

**Description:** Undo/redo for Remotion prop changes

**Files to Modify:**
| Action | File Path |
|--------|-----------|
| MODIFY | `src/stores/timeline-store.ts` |
| MODIFY | `src/stores/timeline/element-operations.ts` |

**Implementation Details:**
- Track Remotion prop changes in history stack
- Batch rapid prop changes (debounce)
- Clear Remotion cache on undo

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/stores/__tests__/timeline-store.undo.remotion.test.ts` | Undo/redo prop changes |

---

### Task 6.7: Error Handling & Recovery

**Description:** Graceful handling of Remotion component failures

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/lib/remotion/error-boundary.tsx` |
| CREATE | `src/lib/remotion/error-recovery.ts` |

**Implementation Details:**
```typescript
interface RemotionError {
  type: 'render' | 'load' | 'validation' | 'timeout';
  elementId: string;
  componentId: string;
  message: string;
  stack?: string;
  recoverable: boolean;
}

interface ErrorRecovery {
  handleError: (error: RemotionError) => void;
  retryRender: (elementId: string) => void;
  skipElement: (elementId: string) => void;
  showPlaceholder: (elementId: string) => void;
}
```

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/lib/remotion/__tests__/error-boundary.test.tsx` | Error catching, recovery UI |
| `src/lib/remotion/__tests__/error-recovery.test.ts` | Retry logic, fallbacks |

---

### Task 6.8: Comprehensive Test Suite

**Description:** Integration and E2E tests for complete flows

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/test/integration/remotion-timeline.test.tsx` |
| CREATE | `src/test/integration/remotion-export.test.ts` |
| CREATE | `src/test/e2e/remotion-workflow.spec.ts` |

**Test Coverage Requirements:**
| Area | Coverage Target |
|------|-----------------|
| Remotion store | 90% |
| Component loader | 85% |
| Pre-renderer | 80% |
| Compositor | 85% |
| Export engine | 80% |
| UI components | 75% |

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/test/integration/remotion-timeline.test.tsx` | Full timeline CRUD flows |
| `src/test/integration/remotion-export.test.ts` | Complete export pipeline |
| `src/test/e2e/remotion-workflow.spec.ts` | User workflow end-to-end |

---

### Task 6.9: Performance Benchmarks

**Description:** Establish and monitor performance baselines

**Files to Create:**
| Action | File Path |
|--------|-----------|
| CREATE | `src/test/benchmarks/remotion-perf.bench.ts` |

**Metrics to Track:**
| Metric | Target |
|--------|--------|
| Preview playback | 30fps smooth |
| Scrubbing latency | < 100ms |
| Component load time | < 500ms |
| Frame cache hit rate | > 80% |
| Memory usage (idle) | < 200MB |
| Export time (1min video) | < 3min |

**Unit Tests:**
| Test File | Description |
|-----------|-------------|
| `src/test/benchmarks/remotion-perf.bench.ts` | Performance regression tests |

---

### Phase 6 Success Criteria Checklist

- [ ] Smooth 30fps preview playback
- [ ] Export completes without memory leaks
- [ ] Drag-drop works intuitively
- [ ] All keyboard shortcuts functional
- [ ] Undo/redo works for all Remotion operations
- [ ] Errors handled gracefully with recovery options
- [ ] Test coverage > 80% for Remotion code
- [ ] All performance targets met

---

## Summary: File Creation/Modification Matrix

### Files to CREATE (New)

| Phase | File Path | Priority |
|-------|-----------|----------|
| 1 | `src/lib/remotion/types.ts` | Critical |
| 1 | `src/stores/remotion-store.ts` | Critical |
| 1 | `src/lib/remotion/player-wrapper.tsx` | Critical |
| 1 | `src/components/editor/preview-panel/remotion-preview.tsx` | Critical |
| 2 | `src/components/editor/timeline/remotion-element.tsx` | Critical |
| 2 | `src/components/editor/media-panel/remotion-picker.tsx` | High |
| 2 | `src/lib/remotion/sync-manager.ts` | Critical |
| 3 | `src/lib/remotion/schema-parser.ts` | High |
| 3 | `src/components/editor/properties-panel/prop-editors/*.tsx` | High |
| 3 | `src/components/editor/properties-panel/remotion-properties.tsx` | High |
| 3 | `src/components/editor/properties-panel/keyframe-editor.tsx` | Medium |
| 3 | `src/lib/remotion/keyframe-converter.ts` | Medium |
| 4 | `src/lib/remotion/pre-renderer.ts` | Critical |
| 4 | `src/lib/remotion/compositor.ts` | Critical |
| 4 | `src/lib/export-engine-remotion.ts` | Critical |
| 5 | `src/lib/remotion/built-in/text/*.tsx` | Medium |
| 5 | `src/lib/remotion/built-in/transitions/*.tsx` | Medium |
| 5 | `src/lib/remotion/built-in/templates/*.tsx` | Medium |
| 5 | `src/lib/remotion/component-loader.ts` | High |
| 5 | `src/lib/remotion/component-validator.ts` | High |
| 5 | `src/components/editor/media-panel/component-browser.tsx` | High |
| 6 | `src/lib/remotion/frame-cache.ts` | High |
| 6 | `src/lib/remotion/render-worker.ts` | Medium |
| 6 | `src/lib/remotion/error-boundary.tsx` | High |
| 6 | `src/lib/remotion/error-recovery.ts` | High |

### Files to MODIFY (Existing)

| Phase | File Path | Changes |
|-------|-----------|---------|
| 1 | `qcut/qcut/apps/web/package.json` | Add Remotion deps |
| 2 | `src/types/timeline.ts` | Add RemotionElement type |
| 2 | `src/stores/timeline-store.ts` | Add Remotion CRUD |
| 2 | `src/stores/timeline/element-operations.ts` | Handle RemotionElement |
| 2 | `src/components/editor/timeline/timeline-element.tsx` | Render RemotionElement |
| 2 | `src/components/editor/media-panel/index.tsx` | Add Remotion tab |
| 3 | `src/components/editor/properties-panel/index.tsx` | Show Remotion props |
| 4 | `src/lib/export-engine.ts` | Add Remotion phases |
| 4 | `src/lib/export-engine-factory.ts` | Remotion engine selection |
| 4 | `src/lib/audio-mixer.ts` | Mix Remotion audio |
| 4 | `src/components/export-dialog.tsx` | Show pre-render progress |
| 4 | `src/stores/export-store.ts` | Track Remotion export state |
| 6 | `src/stores/keybindings-store.ts` | Add Remotion shortcuts |
| 6 | `src/constants/actions.ts` | Define Remotion actions |

---

## Dependencies Between Tasks

```
Phase 1 Foundation
├── Task 1.1 Dependencies ─────► Task 1.2 Types
│                                    │
│                                    ▼
│                              Task 1.3 Store
│                                    │
│                                    ▼
│                              Task 1.4 Player
│                                    │
│                                    ▼
└──────────────────────────── Task 1.5 Preview Panel

Phase 2 Timeline (depends on Phase 1)
├── Task 2.1 Types ─────────► Task 2.2 Store
│                                  │
│                                  ├──► Task 2.3 Element Renderer
│                                  │
│                                  └──► Task 2.4 Picker
│
└── Task 2.5 Sync Manager (parallel)

Phase 3 Properties (depends on Phase 2)
├── Task 3.1 Schema Parser ──► Task 3.2 Prop Editors
│                                    │
│                                    ▼
│                              Task 3.3 Properties Panel
│
└── Task 3.4 Keyframe Editor (parallel)

Phase 4 Export (depends on Phase 2)
├── Task 4.1 Pre-renderer ──► Task 4.2 Compositor
│                                   │
│                                   ▼
│                             Task 4.3 Export Engine
│
├── Task 4.4 Audio Mixer (parallel)
│
└── Task 4.5 Export UI (depends on 4.3)

Phase 5 Library (depends on Phase 1)
├── Task 5.1-5.3 Components (parallel)
│
├── Task 5.4 Browser (depends on 5.1-5.3)
│
└── Task 5.5 Import System (parallel)

Phase 6 Polish (depends on all)
├── Tasks 6.1-6.7 (can be parallelized)
│
└── Tasks 6.8-6.9 Testing (last)
```

---

## Risk Mitigation Strategies

| Risk | Mitigation | Owner |
|------|------------|-------|
| Remotion version conflicts | Pin version, test upgrades in isolation | Phase 1 |
| Performance regressions | Benchmark before each phase merge | Phase 6 |
| Memory leaks | Profile after each export, cleanup handlers | Phase 4/6 |
| Complex component imports | Sandbox validation, progressive security | Phase 5 |
| Export quality issues | Visual regression tests | Phase 4 |
| Browser compatibility | Test Firefox, Chrome, Safari, Edge | Phase 6 |

---

## Long-Term Maintenance Considerations

1. **Remotion Version Updates**
   - Monitor Remotion changelog
   - Test major updates in feature branch
   - Document breaking changes in CHANGELOG

2. **Component Library Growth**
   - Establish component contribution guidelines
   - Create component template generator
   - Version control for built-in components

3. **Performance Monitoring**
   - Add Sentry/logging for export failures
   - Track cache hit rates in production
   - Monitor memory usage patterns

4. **Documentation**
   - Update user guide with each phase
   - Maintain API documentation
   - Create video tutorials for component creation

---

*This implementation plan should be reviewed and updated as development progresses. Each task completion should be verified against its success criteria before moving to dependent tasks.*
