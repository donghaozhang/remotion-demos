# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start Remotion Studio (interactive development)
npm run dev

# Render a specific composition to video
npx remotion render <CompositionId> output.mp4

# Bundle for production
npm run build

# Lint and type-check
npm run lint

# Upgrade Remotion
npm run upgrade
```

### Available Compositions

- `ClaudeCodeDemo` - Claude Code promotional video (580 frames, ~19s)
- `QCutDemo` - QCut video editor demo (610 frames, ~20s)
- `SkillsDemo` - Interactive terminal skill demo (540 frames, ~18s)
- `HelloWorld` - Starter template (150 frames, 5s)
- `OnlyLogo` - Logo animation only

## Architecture

This is a Remotion project for creating programmatic demo videos using React components.

### Project Structure

```
src/
├── Root.tsx              # Composition registry - all videos defined here
├── index.css             # Tailwind CSS entry
├── ClaudeCodeDemo/       # Multi-scene demo video
│   ├── index.tsx         # TransitionSeries orchestration
│   ├── IntroScene.tsx    # Opening scene
│   ├── TerminalScene.tsx # Terminal typing simulation
│   ├── FeaturesScene.tsx # Feature grid animation
│   ├── CodeScene.tsx     # Code diff visualization
│   └── OutroScene.tsx    # CTA and closing
├── QCutDemo/             # Similar scene-based structure
├── SkillsDemo/           # Terminal window mockup
└── HelloWorld/           # Template components
```

### Key Patterns

**Scene-Based Structure:** Each demo uses `TransitionSeries` to compose scenes with transitions:
```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <IntroScene />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 20 })}
  />
  <TransitionSeries.Sequence durationInFrames={180}>
    <TerminalScene />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**Duration Calculation:** Total duration = sum of scenes - (transitions × overlap). Each composition exports a `TOTAL_DURATION` constant.

**Animation Primitives:**
- `spring()` - Physics-based animations with damping/stiffness
- `interpolate()` - Value mapping between frame ranges
- `useCurrentFrame()` - Get current frame for time-based effects
- `useVideoConfig()` - Access fps, width, height

### Submodules

- `qcut/` - QCut video editor (branch: `remotion-integration`)
- `remotion-repo/` - Reference Remotion repository

See `docs/qcut-remotion-integration/` for integration documentation.

## How to Build

### Remotion Project (this repo)

```bash
# Install dependencies
npm install

# Start Remotion Studio for development
npm run dev

# Build for production
npm run build

# Render a video
npx remotion render <CompositionId> output.mp4
```

### QCut Submodule

```bash
# Navigate to QCut
cd qcut/qcut

# Install dependencies
bun install

# Build QCut
bun run build

# Run in development mode (browser)
bun run dev

# Run Electron app (desktop)
bun run electron:dev
```

### Full Setup from Scratch

```bash
# Clone with submodules
git clone --recursive https://github.com/donghaozhang/remotion-demos.git
cd remotion-demos

# Or if already cloned, init submodules
git submodule update --init --recursive

# Install Remotion dependencies
npm install

# Install QCut dependencies
cd qcut/qcut && bun install && cd ../..

# Build QCut
cd qcut/qcut && bun run build && cd ../..

# Now you can run either:
# - Remotion Studio: npm run dev
# - QCut Electron: cd qcut/qcut && bun run electron:dev
```

## Video Specifications

All compositions: **1920×1080 @ 30fps**

Output format configured in `remotion.config.ts`:
- Image format: JPEG
- Tailwind CSS v4 enabled via webpack override
