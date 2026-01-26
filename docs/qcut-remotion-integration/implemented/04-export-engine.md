# 04 - Unified Export Engine

## Overview

This document describes the unified export system that handles both QCut native elements and Remotion components in a single export pipeline.

## Export Pipeline

```
Export Triggered
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                 Phase 1: Analysis                     │
├───────────────────────────────────────────────────────┤
│ • Scan timeline for all elements                      │
│ • Identify Remotion components                        │
│ • Calculate total frame count                         │
│ • Estimate resource requirements                      │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│              Phase 2: Pre-render Remotion             │
├───────────────────────────────────────────────────────┤
│ • Render each Remotion element to frame sequence      │
│ • Store in temporary directory                        │
│ • Progress: 0-40%                                     │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│              Phase 3: Frame Composition               │
├───────────────────────────────────────────────────────┤
│ • For each frame:                                     │
│   - Render QCut elements to canvas                    │
│   - Load pre-rendered Remotion frames                 │
│   - Composite all layers                              │
│   - Apply final effects                               │
│ • Progress: 40-90%                                    │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│              Phase 4: Encode Video                    │
├───────────────────────────────────────────────────────┤
│ • Combine frames with audio                           │
│ • Encode to target format                             │
│ • Progress: 90-100%                                   │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│              Phase 5: Cleanup                         │
├───────────────────────────────────────────────────────┤
│ • Delete temporary frame sequences                    │
│ • Clear memory caches                                 │
│ • Report final status                                 │
└───────────────────────────────────────────────────────┘
        │
        ▼
    Video File
```

## Export Engine Selection

### Available Engines

| Engine | Remotion Support | Speed | Quality | Use Case |
|--------|------------------|-------|---------|----------|
| FFmpeg WASM | Via pre-render | Fast | Good | Quick exports |
| Native FFmpeg | Via pre-render | Fastest | Best | Desktop app |
| Remotion Renderer | Native | Medium | Best | Complex animations |
| Hybrid | Combined | Medium | Best | Mixed content |

### Selection Logic

```
hasRemotionElements?
        │
        ├─── No ───► Use existing QCut export engine
        │
        └─── Yes ──► Check complexity
                            │
                ┌───────────┴───────────┐
                │                       │
        Simple Remotion          Complex Remotion
        (< 5 components)         (5+ components)
                │                       │
                ▼                       ▼
        Pre-render + FFmpeg      Full Remotion Render
        (Hybrid approach)        (Maximum quality)
```

## Remotion Pre-rendering

### Pre-render Configuration

```typescript
interface PreRenderConfig {
  outputDir: string;          // Temp directory for frames
  format: 'png' | 'jpeg';     // Frame format
  quality: number;            // 0-100 for JPEG
  concurrency: number;        // Parallel render threads
  scale: number;              // Resolution scale (1 = original)
}
```

### Pre-render Process

```
For each Remotion element in timeline:
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Extract Component Info                               │
├───────────────────────────────────────────────────────┤
│  componentId: string                                  │
│  startFrame: number                                   │
│  endFrame: number                                     │
│  props: object                                        │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Call Remotion renderMedia                            │
├───────────────────────────────────────────────────────┤
│  await renderMedia({                                  │
│    composition: getComposition(componentId),          │
│    serveUrl: bundleLocation,                          │
│    codec: 'png-sequence',                             │
│    outputLocation: `${tempDir}/${elementId}/`,        │
│    inputProps: props,                                 │
│    durationInFrames: endFrame - startFrame            │
│  });                                                  │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Register Frame Paths                                 │
├───────────────────────────────────────────────────────┤
│  frameMap[elementId] = {                              │
│    basePath: `${tempDir}/${elementId}/`,              │
│    frameCount: endFrame - startFrame,                 │
│    format: 'png'                                      │
│  }                                                    │
└───────────────────────────────────────────────────────┘
```

## Frame Composition

### Compositor Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frame Compositor                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Layer 1     │  │ Layer 2     │  │ Layer 3     │         │
│  │ (QCut bg)   │  │ (Remotion)  │  │ (QCut text) │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│                 ┌─────────────────┐                         │
│                 │  Alpha Blend    │                         │
│                 │  (z-order)      │                         │
│                 └────────┬────────┘                         │
│                          │                                  │
│                          ▼                                  │
│                 ┌─────────────────┐                         │
│                 │  Final Effects  │                         │
│                 │  (global)       │                         │
│                 └────────┬────────┘                         │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           ▼
                    Composite Frame
```

### Layer Ordering

```typescript
interface CompositeLayer {
  zIndex: number;
  source: 'qcut' | 'remotion';
  elementId: string;
  blendMode: BlendMode;
  opacity: number;
  mask?: ImageData;
}

// Sort layers by z-index
const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);

// Composite bottom to top
for (const layer of sortedLayers) {
  compositeLayer(outputCanvas, layer);
}
```

### Blend Modes

| Mode | Effect | Use Case |
|------|--------|----------|
| `normal` | Standard overlay | Default |
| `multiply` | Darken | Shadows, overlays |
| `screen` | Lighten | Glow effects |
| `overlay` | Contrast | Color grading |
| `add` | Additive | Light effects |

## Audio Handling

### Audio Sources

```
Audio Tracks:
├── QCut Audio Elements
│   ├── Imported audio files
│   └── Video audio tracks
├── Remotion Audio
│   ├── <Audio> components
│   └── Generated audio
└── Mixed Output
```

### Audio Mixing Pipeline

```
┌───────────────────────────────────────────────────────┐
│                 Audio Mixer                           │
├───────────────────────────────────────────────────────┤
│                                                       │
│  QCut Audio                    Remotion Audio         │
│      │                              │                 │
│      ▼                              ▼                 │
│  ┌─────────┐                   ┌─────────┐           │
│  │ Decode  │                   │ Extract │           │
│  │ (FFmpeg)│                   │ (from   │           │
│  │         │                   │  render)│           │
│  └────┬────┘                   └────┬────┘           │
│       │                             │                 │
│       └─────────────┬───────────────┘                 │
│                     ▼                                 │
│              ┌─────────────┐                          │
│              │   Mix       │                          │
│              │  (volume,   │                          │
│              │   timing)   │                          │
│              └──────┬──────┘                          │
│                     │                                 │
└─────────────────────┼─────────────────────────────────┘
                      ▼
               Mixed Audio Track
```

## Export Options

### Format Settings

```typescript
interface ExportSettings {
  // Video
  format: 'mp4' | 'webm' | 'mov' | 'avi';
  codec: 'h264' | 'h265' | 'vp9' | 'prores';
  resolution: { width: number; height: number };
  fps: number;
  bitrate: string;        // e.g., '8M'

  // Audio
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: string;   // e.g., '192k'
  sampleRate: number;     // e.g., 48000

  // Remotion-specific
  remotionQuality: 'draft' | 'preview' | 'final';
  preRenderConcurrency: number;
  useGpu: boolean;
}
```

### Quality Presets

| Preset | Resolution | Bitrate | Remotion Quality | Use Case |
|--------|------------|---------|------------------|----------|
| Draft | 720p | 2M | draft | Quick preview |
| Standard | 1080p | 8M | preview | Social media |
| High | 1080p | 15M | final | General use |
| Professional | 4K | 50M | final | Broadcast |

## Progress Reporting

### Progress Events

```typescript
interface ExportProgress {
  phase: 'analyzing' | 'prerender' | 'compositing' | 'encoding' | 'cleanup';
  progress: number;           // 0-100
  currentFrame: number;
  totalFrames: number;
  currentElement?: string;    // Element being processed
  estimatedTimeRemaining: number; // Seconds
  errors: ExportError[];
}
```

### Progress UI Integration

```
┌─────────────────────────────────────────────────────────┐
│                    Export Progress                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase: Compositing                                     │
│  ████████████████░░░░░░░░░░░░░░  52%                   │
│                                                         │
│  Frame: 156 / 300                                       │
│  Current: Remotion intro scene                          │
│  Time remaining: ~2 minutes                             │
│                                                         │
│  [Cancel]                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Error Recovery

### Error Types

| Error | Recovery Action |
|-------|-----------------|
| Remotion render fail | Retry with lower quality, or skip element |
| Memory overflow | Reduce concurrency, clear cache, retry |
| Disk full | Prompt user, cleanup temp files |
| Codec error | Fallback to alternative codec |
| Timeout | Increase timeout, retry segment |

### Partial Export

If export fails midway:

```
Export Failed at Frame 200/300
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Options:                                             │
│  • Resume from frame 200                              │
│  • Export partial (0-200)                             │
│  • Retry with lower quality                           │
│  • Cancel and cleanup                                 │
└───────────────────────────────────────────────────────┘
```

## Temporary File Management

### Directory Structure

```
temp/
└── export-{sessionId}/
    ├── remotion/
    │   ├── element-1/
    │   │   ├── frame-0000.png
    │   │   ├── frame-0001.png
    │   │   └── ...
    │   └── element-2/
    │       └── ...
    ├── composite/
    │   ├── frame-0000.png
    │   └── ...
    ├── audio/
    │   ├── mixed.wav
    │   └── segments/
    └── output/
        └── final.mp4
```

### Cleanup Strategy

```
Export Complete
        │
        ├── Success ──► Delete all temp files
        │
        └── Failed ───► Keep for debugging (optional)
                              │
                              ▼
                        Auto-cleanup after 24h
```
