# 05 - Implementation Phases

## Overview

This document outlines the step-by-step implementation plan for integrating Remotion rendering capabilities into QCut.

## Phase Summary

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| Phase 1 | Foundation | Remotion Player embedded in QCut |
| Phase 2 | Timeline Integration | Remotion elements on timeline |
| Phase 3 | Properties Panel | Edit Remotion props in QCut |
| Phase 4 | Export Pipeline | Unified export with Remotion |
| Phase 5 | Component Library | Built-in Remotion templates |
| Phase 6 | Polish | Performance, UX, documentation |

---

## Phase 1: Foundation

**Goal:** Get Remotion Player running inside QCut

### Tasks

```
□ Add Remotion dependencies to QCut
  ├── @remotion/player
  ├── @remotion/bundler (for component loading)
  └── remotion

□ Create RemotionPlayerWrapper component
  ├── Wrap @remotion/player
  ├── Match QCut's video dimensions
  └── Expose imperative controls (play, pause, seek)

□ Add Remotion preview panel
  ├── New tab in preview area
  ├── Load sample composition
  └── Basic playback controls

□ Create remotion-store.ts
  ├── Store for Remotion state
  ├── Component registry placeholder
  └── Player instance management
```

### Success Criteria

- [ ] Remotion Player renders in QCut
- [ ] Sample Remotion composition plays
- [ ] Player responds to external seek commands

### Files to Create/Modify

```
apps/web/src/
├── lib/remotion/
│   ├── player-wrapper.tsx      # NEW
│   └── types.ts                # NEW
├── stores/
│   └── remotion-store.ts       # NEW
└── components/editor/
    └── preview-panel/
        └── remotion-preview.tsx # NEW
```

---

## Phase 2: Timeline Integration

**Goal:** Add Remotion elements to QCut timeline

### Tasks

```
□ Define RemotionElement type
  ├── Extend TimelineElement
  ├── Add componentId field
  └── Add props field

□ Create timeline element renderer
  ├── Visual representation on timeline
  ├── Distinct styling (purple/blue theme)
  └── Duration handle (resize)

□ Add "Add Remotion" option
  ├── Button in media panel
  ├── Component selector modal
  └── Insert at playhead

□ Sync playback with timeline
  ├── Timeline scrub → Remotion seek
  ├── Play/pause sync
  └── Frame-accurate positioning
```

### Success Criteria

- [ ] Remotion elements appear on timeline
- [ ] Elements can be moved and resized
- [ ] Scrubbing updates Remotion preview
- [ ] Multiple Remotion elements supported

### Files to Create/Modify

```
apps/web/src/
├── types/
│   └── timeline.ts             # MODIFY - add RemotionElement
├── stores/
│   └── timeline-store.ts       # MODIFY - handle RemotionElement
├── components/editor/
│   ├── timeline/
│   │   └── remotion-element.tsx # NEW
│   └── media-panel/
│       └── remotion-picker.tsx  # NEW
└── lib/remotion/
    └── sync-manager.ts          # NEW
```

---

## Phase 3: Properties Panel

**Goal:** Edit Remotion component props in QCut

### Tasks

```
□ Create Remotion properties panel
  ├── Show when Remotion element selected
  ├── Display component props
  └── Live preview on change

□ Build prop editor components
  ├── Text input
  ├── Number slider
  ├── Color picker
  ├── Dropdown select
  └── Boolean toggle

□ Implement Zod schema parsing
  ├── Read component's schema
  ├── Generate form fields
  └── Validate input

□ Add keyframe support
  ├── Animate props over time
  ├── Keyframe editor UI
  └── Convert to Remotion interpolate
```

### Success Criteria

- [ ] Props panel shows component properties
- [ ] Editing props updates preview
- [ ] Schema validation prevents invalid values
- [ ] Basic keyframe animation works

### Files to Create/Modify

```
apps/web/src/
├── components/editor/
│   └── properties-panel/
│       ├── remotion-properties.tsx    # NEW
│       ├── prop-editors/
│       │   ├── text-prop.tsx          # NEW
│       │   ├── number-prop.tsx        # NEW
│       │   ├── color-prop.tsx         # NEW
│       │   └── select-prop.tsx        # NEW
│       └── keyframe-editor.tsx        # NEW
└── lib/remotion/
    └── schema-parser.ts               # NEW
```

---

## Phase 4: Export Pipeline

**Goal:** Export videos with mixed QCut + Remotion content

### Tasks

```
□ Implement Remotion pre-renderer
  ├── Render Remotion elements to frames
  ├── Store in temp directory
  └── Progress reporting

□ Create frame compositor
  ├── Merge QCut canvas + Remotion frames
  ├── Respect z-order/layers
  └── Apply blend modes

□ Modify export engine
  ├── Detect Remotion elements
  ├── Trigger pre-render phase
  └── Use compositor for mixed frames

□ Handle audio mixing
  ├── Extract Remotion audio
  ├── Mix with QCut audio
  └── Sync timing

□ Add export UI updates
  ├── Show pre-render progress
  ├── Indicate Remotion processing
  └── Error handling for Remotion
```

### Success Criteria

- [ ] Export works with Remotion elements
- [ ] Video quality matches expectations
- [ ] Audio properly mixed
- [ ] Progress accurately reported

### Files to Create/Modify

```
apps/web/src/
└── lib/
    ├── remotion/
    │   ├── pre-renderer.ts       # NEW
    │   └── compositor.ts         # NEW
    ├── export-engine.ts          # MODIFY
    └── audio-mixer.ts            # MODIFY
```

---

## Phase 5: Component Library

**Goal:** Provide built-in Remotion templates

### Tasks

```
□ Create built-in components
  ├── Text animations (TypeWriter, FadeIn, etc.)
  ├── Transitions (Wipe, Dissolve, etc.)
  ├── Lower thirds
  ├── Intro/outro templates
  └── Shape animations

□ Build component browser
  ├── Categorized list
  ├── Preview thumbnails
  ├── Search functionality
  └── Favorites

□ Implement component import
  ├── Import from .tsx file
  ├── Validate structure
  ├── Security sandbox
  └── Store in IndexedDB

□ Add component packaging
  ├── Export custom components
  ├── Share format (.qcut-component)
  └── Import shared components
```

### Success Criteria

- [ ] 10+ built-in components available
- [ ] Component browser functional
- [ ] Custom import works
- [ ] Components can be shared

### Files to Create/Modify

```
apps/web/src/
├── lib/remotion/
│   ├── built-in/
│   │   ├── text/
│   │   │   ├── typewriter.tsx      # NEW
│   │   │   ├── fade-in-text.tsx    # NEW
│   │   │   └── bounce-text.tsx     # NEW
│   │   ├── transitions/
│   │   │   ├── wipe.tsx            # NEW
│   │   │   └── dissolve.tsx        # NEW
│   │   └── templates/
│   │       ├── lower-third.tsx     # NEW
│   │       └── intro-scene.tsx     # NEW
│   ├── component-loader.ts         # NEW
│   └── component-validator.ts      # NEW
└── components/editor/
    └── media-panel/
        └── component-browser.tsx   # NEW
```

---

## Phase 6: Polish

**Goal:** Optimize performance and user experience

### Tasks

```
□ Performance optimization
  ├── Frame caching (LRU)
  ├── Lazy component loading
  ├── Worker thread rendering
  └── Memory management

□ UX improvements
  ├── Drag-drop Remotion to timeline
  ├── Right-click context menu
  ├── Keyboard shortcuts
  └── Undo/redo for Remotion changes

□ Error handling
  ├── Graceful component failures
  ├── Informative error messages
  ├── Recovery options
  └── Logging for debugging

□ Documentation
  ├── User guide for Remotion features
  ├── Component creation tutorial
  ├── API documentation
  └── Troubleshooting guide

□ Testing
  ├── Unit tests for bridge logic
  ├── Integration tests for export
  ├── E2E tests for timeline
  └── Performance benchmarks
```

### Success Criteria

- [ ] Smooth 30fps preview playback
- [ ] Export time reasonable
- [ ] No memory leaks
- [ ] User documentation complete
- [ ] Test coverage > 80%

---

## Timeline Estimate

```
Phase 1: Foundation          ████░░░░░░
Phase 2: Timeline            ████████░░
Phase 3: Properties          ██████░░░░
Phase 4: Export              ████████████
Phase 5: Library             ██████████░░
Phase 6: Polish              ████████░░░░

Legend: █ = Implementation work
```

## Dependencies Between Phases

```
Phase 1 ─────► Phase 2 ─────► Phase 3
   │              │              │
   │              └──────────────┼──────► Phase 4
   │                             │
   └─────────────────────────────┼──────► Phase 5
                                 │
                                 └──────► Phase 6
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Remotion version conflicts | Pin specific version, test upgrades carefully |
| Performance issues | Implement caching early, benchmark regularly |
| Complex component imports | Start with simple validation, expand gradually |
| Export quality problems | Test with various content types early |
| Memory leaks | Profile regularly, implement cleanup handlers |

## Go/No-Go Checkpoints

### After Phase 2

- [ ] Can basic Remotion elements be placed on timeline?
- [ ] Is performance acceptable for development?
- [ ] Are there blocking technical issues?

### After Phase 4

- [ ] Does export produce valid video files?
- [ ] Is quality acceptable?
- [ ] Are there critical bugs?

### Before Release

- [ ] All phases complete
- [ ] No critical bugs
- [ ] Documentation ready
- [ ] Performance targets met
