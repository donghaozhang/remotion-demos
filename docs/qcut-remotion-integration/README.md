# QCut + Remotion Dual Rendering Integration

## Goal

Modify QCut to support rendering both native QCut components AND Remotion components within the same timeline, giving users the best of both worlds:

- **QCut**: Visual timeline editing, AI features, effects, stickers
- **Remotion**: React-based animations, spring physics, code-defined compositions

## Documents

| Document | Description |
|----------|-------------|
| [01-architecture.md](./01-architecture.md) | Dual rendering system architecture |
| [02-remotion-renderer.md](./02-remotion-renderer.md) | Adding Remotion as a rendering engine |
| [03-component-bridge.md](./03-component-bridge.md) | Bridging QCut timeline to Remotion |
| [04-export-engine.md](./04-export-engine.md) | Unified export system |
| [05-implementation-phases.md](./05-implementation-phases.md) | Step-by-step implementation plan |

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

## Benefits

1. **Visual Editing** - Edit Remotion components visually in QCut's timeline
2. **Code Power** - Import custom Remotion animations as timeline elements
3. **AI Features** - Apply QCut's AI capabilities to Remotion compositions
4. **Unified Export** - Single export pipeline for mixed content
5. **Best Animations** - Access Remotion's spring physics in QCut projects
