# Remotion Demo Videos

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

A collection of programmatic demo videos built with [Remotion](https://remotion.dev), plus integration with [QCut](https://github.com/donghaozhang/qcut) video editor.

## Available Compositions

| Composition | Duration | Description |
|-------------|----------|-------------|
| `ClaudeCodeDemo` | ~19s (580 frames) | Claude Code promotional video |
| `QCutDemo` | ~20s (610 frames) | QCut video editor demo |
| `SkillsDemo` | ~18s (540 frames) | Interactive terminal skill demo |
| `HelloWorld` | 5s (150 frames) | Starter template |
| `OnlyLogo` | - | Logo animation only |

All compositions: **1920×1080 @ 30fps**

## Quick Start

```bash
# Install dependencies
npm install

# Start Remotion Studio (interactive development)
npm run dev

# Render a specific composition
npx remotion render ClaudeCodeDemo output.mp4

# Render all compositions
npx remotion render
```

## Project Structure

```
├── src/
│   ├── Root.tsx              # Composition registry
│   ├── ClaudeCodeDemo/       # Multi-scene demo video
│   ├── QCutDemo/             # QCut editor demo
│   ├── SkillsDemo/           # Terminal animation
│   └── HelloWorld/           # Starter template
├── qcut/                     # QCut submodule (remotion-integration branch)
└── docs/                     # Integration documentation
```

## QCut Integration

This repository includes QCut as a submodule with full Remotion integration, enabling:

- **Remotion Component Library**: 14 built-in components (templates, text animations, transitions)
- **Timeline Integration**: Drag-and-drop Remotion components onto the timeline
- **Live Preview**: Real-time synchronized preview with timeline playback
- **Properties Panel**: Edit component props directly in the editor
- **Export Pipeline**: Render Remotion elements to final video

### Running QCut with Remotion

```bash
# Initialize submodule
git submodule update --init --recursive

# Navigate to QCut
cd qcut/qcut/apps/web

# Install dependencies
bun install

# Start development server
bun run dev

# Or run Electron app
cd ../.. && bun run electron
```

See [Integration Documentation](docs/qcut-remotion-integration/) for detailed setup and usage.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Remotion Studio |
| `npm run build` | Bundle for production |
| `npm run lint` | Lint and type-check |
| `npm run upgrade` | Upgrade Remotion version |
| `npx remotion render <id>` | Render specific composition |

## Resources

- [Remotion Documentation](https://www.remotion.dev/docs/the-fundamentals)
- [Remotion Discord](https://discord.gg/6VzzNDwUwV)
- [QCut Repository](https://github.com/donghaozhang/qcut)

## License

Note that for some entities a company license is needed for Remotion. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
