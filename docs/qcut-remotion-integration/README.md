# QCut + Remotion Dual Rendering Integration

## Goal

Modify QCut to support rendering both native QCut components AND Remotion components within the same timeline, giving users the best of both worlds:

- **QCut**: Visual timeline editing, AI features, effects, stickers
- **Remotion**: React-based animations, spring physics, code-defined compositions

## Implementation Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Foundation - dependencies, types, store, player wrapper |
| Phase 2 | ✅ Complete | Timeline Integration - element support, scrubbing, z-order |
| Phase 3 | ✅ Complete | Properties Panel - props editing, schema validation |
| Phase 4 | ✅ Complete | Export Pipeline - pre-renderer, compositor, audio mixer |
| Phase 5 | ✅ Complete | Component Library - 13 built-in components, browser UI |
| Phase 6 | 🔄 In Progress | Polish & Testing - performance, docs, integration tests |

## Folder Structure

```
qcut-remotion-integration/
├── README.md                    # This file
├── IMPLEMENTATION-PLAN.md       # Detailed task tracking with status
│
├── implemented/                 # ✅ Design docs for completed features
│   ├── 01-architecture.md       # Dual rendering architecture
│   ├── 02-remotion-renderer.md  # Remotion renderer design
│   ├── 03-component-bridge.md   # QCut ↔ Remotion bridge
│   ├── 04-export-engine.md      # Unified export system
│   └── 05-implementation-phases.md  # Phase overview
│
├── pending/                     # 🔄 In-progress or remaining work
│   └── 07-debug-remotion-preview.md  # Current debugging issue
│
└── reference/                   # 📚 Reference documentation
    ├── TECHNICAL-CHALLENGES.md      # Why integration is hard
    ├── TECHNICAL-CHALLENGES-ZH.md   # Chinese version
    ├── TROUBLESHOOTING.md           # Common issues and fixes
    ├── 06-remotion-rendering-internals.md  # How Remotion renders
    └── REMOTION_QCUT_INTEGRATION_PLAN.md   # Original high-level plan
```

## Key Concept

```
┌─────────────────────────────────────────────────────────────┐
│                      QCut Timeline                          │
├─────────────────────────────────────────────────────────────┤
│  Track 1: [Video Clip] [QCut Text] [Remotion Component]     │
│  Track 2: [Audio]      [QCut Effect]                        │
│  Track 3: [Remotion Intro Scene] [QCut Sticker]             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │    Unified Renderer     │
              ├─────────────────────────┤
              │  QCut Elements → Canvas │
              │  Remotion → React DOM   │
              │  Composite → Final      │
              └─────────────────────────┘
                            │
                            ▼
                    [Exported Video]
```

## Current Issue

**Preview Not Rendering** - See `pending/07-debug-remotion-preview.md`

The Remotion component appears on the timeline but the preview shows only a gradient background instead of the component content. Investigation suggests `isReady` state may be stuck at `false`.

## Quick Links

### Implemented Features
- [Architecture Design](./implemented/01-architecture.md)
- [Export Engine](./implemented/04-export-engine.md)

### Reference
- [Technical Challenges](./reference/TECHNICAL-CHALLENGES.md)
- [Troubleshooting Guide](./reference/TROUBLESHOOTING.md)
- [Remotion Internals](./reference/06-remotion-rendering-internals.md)

### Tracking
- [Full Implementation Plan](./IMPLEMENTATION-PLAN.md)

## Benefits

1. **Visual Editing** - Edit Remotion components visually in QCut's timeline
2. **Code Power** - Import custom Remotion animations as timeline elements
3. **AI Features** - Apply QCut's AI capabilities to Remotion compositions
4. **Unified Export** - Single export pipeline for mixed content
5. **Best Animations** - Access Remotion's spring physics in QCut projects
