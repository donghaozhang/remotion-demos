# Remotion + QCut Integration Plan

## Overview

This document outlines the plan for combining **Remotion** (programmatic video creation with React) and **QCut** (open-source video editor) into a unified video production workflow.

---

## Project Summaries

### QCut

**QCut** is a free, open-source, privacy-first video editor for Windows desktop.

| Aspect | Details |
|--------|---------|
| **Tech Stack** | Electron + React + Vite + TypeScript |
| **Video Processing** | FFmpeg WASM (client-side) |
| **Rendering** | Canvas 2D API |
| **State Management** | Zustand (16+ stores) |
| **UI Framework** | Radix UI + Tailwind CSS |
| **Key Features** | Timeline editing, effects, AI video generation, stickers, text overlays, captions |
| **Privacy** | All processing happens locally |

**Architecture:**
```
QCut Desktop Application
├── Renderer Process (Vite + React)
│   ├── TanStack Router
│   ├── Zustand Stores
│   └── UI Components
├── Electron Main Process (TypeScript)
│   ├── IPC Handlers
│   ├── FFmpeg Management
│   └── File System Operations
└── Worker Threads
    ├── Video Rendering
    └── Audio Mixing
```

### Remotion Project

This **Remotion project** creates promotional demo videos programmatically using React.

| Aspect | Details |
|--------|---------|
| **Tech Stack** | React 19 + TypeScript + Remotion 4.0 |
| **Animation** | Spring physics, interpolation, transitions |
| **Output** | 1920x1080 @ 30fps video files |
| **Compositions** | ClaudeCodeDemo, QCutDemo, SkillsDemo, HelloWorld |

**Key Remotion Features Used:**
- `Composition` - Video definition with metadata
- `TransitionSeries` - Scene-based structure
- `Sequence` - Time-based sequencing
- `spring()` - Physics-based animations
- `interpolate()` - Value mapping with easing
- `fade()` / `slide()` - Scene transitions

---

## Integration Options

### Option 1: Remotion as QCut's Rendering Engine (Recommended)

Replace QCut's Canvas-based rendering with Remotion's React-based rendering.

**Benefits:**
- Higher quality animations with spring physics
- Declarative video composition using React
- Better keyframe animation system
- Consistent rendering across preview and export

**Implementation Steps:**
1. Add `@remotion/core` and `@remotion/renderer` to QCut
2. Convert QCut's timeline data structure → Remotion Composition
3. Map QCut effects to Remotion animation primitives
4. Use Remotion's `renderMedia()` for export instead of FFmpeg WASM
5. Keep QCut's UI but swap the rendering backend

**Complexity:** High | **Impact:** High

---

### Option 2: Export QCut Timeline to Remotion Code

Generate Remotion source code from QCut projects.

**Benefits:**
- Users edit visually in QCut, get code output
- Developers can customize generated code
- Best of both worlds: GUI editing + code control

**Implementation Steps:**
1. Create a QCut → Remotion code generator
2. Map timeline tracks to `<Sequence>` components
3. Convert effects to `interpolate()` / `spring()` calls
4. Export as `.tsx` files ready to render with Remotion CLI

**Complexity:** Medium | **Impact:** Medium

---

### Option 3: Import Remotion Compositions into QCut

Allow QCut to import and edit Remotion compositions.

**Benefits:**
- Bring Remotion's code-defined videos into QCut for further editing
- Add AI effects, captions, etc. on top of Remotion videos
- Non-developers can work with Remotion content

**Implementation Steps:**
1. Render Remotion compositions to video files
2. Import rendered videos into QCut's media library
3. Apply QCut's effects and editing on top
4. Re-export with QCut's FFmpeg pipeline

**Complexity:** Low | **Impact:** Low

---

### Option 4: Shared Animation Component Library

Create reusable animation components that work in both systems.

**Benefits:**
- Consistent visual identity across tools
- Write once, use in both QCut and Remotion
- Easier maintenance

**Implementation Steps:**
1. Extract animation primitives (springs, easing, transitions)
2. Create a shared `@qcut/animations` package
3. Implement both Canvas and React renderers
4. Use in QCut preview and Remotion export

**Complexity:** Medium | **Impact:** Medium

---

### Option 5: Hybrid Workflow

Use both tools for different stages of production.

| Stage | Tool | Purpose |
|-------|------|---------|
| Scripting | Remotion | Create animated templates with code |
| Editing | QCut | Visual timeline editing, AI features |
| Effects | QCut | Apply filters, stickers, captions |
| Final Export | Either | Choose based on quality/speed needs |

**Complexity:** Low | **Impact:** Medium

---

## Recommended Approach: Phased Integration

### Phase 1: Basic Integration
- Export Remotion videos → Import into QCut
- Use QCut for post-processing and AI enhancements
- **Deliverable:** Documentation for workflow

### Phase 2: Timeline Interoperability
- Create a converter: QCut timeline JSON ↔ Remotion composition
- Allow round-trip editing between both tools
- **Deliverable:** `@qcut/remotion-converter` package

### Phase 3: Unified Rendering
- Add Remotion as an optional export engine in QCut
- Users choose between FFmpeg WASM (fast) or Remotion (quality)
- **Deliverable:** New export engine option in QCut

### Phase 4: Component Sharing
- Build shared effect library
- Same animations work in both tools
- **Deliverable:** `@qcut/animations` package

---

## Technical Considerations

### Data Structure Mapping

| QCut Concept | Remotion Equivalent |
|--------------|---------------------|
| Timeline | `Composition` |
| Track | `Sequence` |
| Clip | React Component |
| Effect | `interpolate()` / `spring()` |
| Keyframe | Frame-based animation |
| Transition | `TransitionSeries` |

### Rendering Comparison

| Aspect | QCut | Remotion |
|--------|------|----------|
| **Engine** | Canvas 2D | React DOM → Headless Chrome |
| **State** | Zustand stores | Frame-based props |
| **Effects** | Effect chains | `interpolate()` functions |
| **Export** | FFmpeg WASM | `renderMedia()` (FFmpeg) |
| **Audio** | Web Audio API | Remotion audio components |

### Compatibility Matrix

| Feature | QCut Support | Remotion Support | Integration Difficulty |
|---------|--------------|------------------|----------------------|
| Text overlays | ✅ | ✅ | Easy |
| Video clips | ✅ | ✅ | Easy |
| Audio tracks | ✅ | ✅ | Medium |
| Effects/Filters | ✅ | ✅ | Medium |
| Keyframes | ✅ | ✅ | Medium |
| AI generation | ✅ | ❌ | Keep in QCut |
| Spring animations | ❌ | ✅ | Add to QCut |
| Code-first workflow | ❌ | ✅ | Export feature |

---

## File Structure After Integration

```
qcut/
├── apps/web/
│   └── src/
│       ├── lib/
│       │   ├── export-engine.ts          # Existing FFmpeg export
│       │   ├── remotion-export-engine.ts # NEW: Remotion export
│       │   └── timeline-to-remotion.ts   # NEW: Converter
│       └── components/
│           └── editor/
│               └── export-dialog.tsx     # Add Remotion option
├── packages/
│   ├── animations/                       # NEW: Shared animations
│   │   ├── src/
│   │   │   ├── spring.ts
│   │   │   ├── interpolate.ts
│   │   │   └── transitions.ts
│   │   └── package.json
│   └── remotion-converter/               # NEW: QCut ↔ Remotion
│       ├── src/
│       │   ├── qcut-to-remotion.ts
│       │   └── remotion-to-qcut.ts
│       └── package.json
└── remotion/                             # Remotion compositions
    └── src/
        ├── Root.tsx
        └── compositions/
```

---

## Next Steps

1. **Decide on integration approach** - Choose Option 1-5 or phased approach
2. **Create proof of concept** - Build minimal QCut → Remotion converter
3. **Test with real projects** - Validate with actual QCut project files
4. **Iterate on API design** - Refine the integration interface
5. **Document workflow** - Create user-facing documentation

---

## Resources

- **QCut Repository:** https://github.com/donghaozhang/qcut.git
- **Remotion Documentation:** https://remotion.dev/docs
- **Remotion GitHub:** https://github.com/remotion-dev/remotion

---

## Appendix: QCut Timeline Data Structure

Example QCut timeline JSON (simplified):

```json
{
  "id": "project-123",
  "name": "My Video",
  "duration": 300,
  "fps": 30,
  "resolution": { "width": 1920, "height": 1080 },
  "tracks": [
    {
      "id": "track-1",
      "type": "video",
      "elements": [
        {
          "id": "clip-1",
          "type": "video",
          "src": "video.mp4",
          "start": 0,
          "duration": 150,
          "effects": [
            { "type": "fade-in", "duration": 30 }
          ]
        }
      ]
    },
    {
      "id": "track-2",
      "type": "text",
      "elements": [
        {
          "id": "text-1",
          "type": "text",
          "content": "Hello World",
          "start": 50,
          "duration": 100,
          "style": { "fontSize": 48, "color": "#ffffff" }
        }
      ]
    }
  ]
}
```

## Appendix: Equivalent Remotion Composition

```tsx
import { Composition, Sequence, AbsoluteFill } from 'remotion';
import { fade } from '@remotion/transitions';

export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={150}>
        <FadeIn durationInFrames={30}>
          <Video src="video.mp4" />
        </FadeIn>
      </Sequence>

      <Sequence from={50} durationInFrames={100}>
        <Text
          content="Hello World"
          style={{ fontSize: 48, color: '#ffffff' }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

*Document created: 2026-01-24*
