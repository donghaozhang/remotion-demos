import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CLAUDE_ORANGE = "#E87B35";
const DARK_BG = "#1a1a2e";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Logo rotation entrance
  const logoRotation = interpolate(
    spring({ frame, fps, config: { damping: 20 } }),
    [0, 1],
    [-180, 0]
  );

  // Title slide in
  const titleProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15 },
  });
  const titleX = interpolate(titleProgress, [0, 1], [100, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Subtitle fade in
  const subtitleProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 20 },
  });
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);

  // Glow pulse
  const glowIntensity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 50%, rgba(232, 123, 53, ${glowIntensity * 0.15}) 0%, transparent 50%)`,
        }}
      />

      {/* Logo container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
        }}
      >
        {/* Claude Code Logo */}
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Terminal icon */}
            <rect
              x="10"
              y="20"
              width="100"
              height="80"
              rx="8"
              fill="#2d2d44"
              stroke={CLAUDE_ORANGE}
              strokeWidth="3"
            />
            <rect x="10" y="20" width="100" height="20" rx="8" fill="#3d3d54" />
            <circle cx="28" cy="30" r="4" fill="#ff5f56" />
            <circle cx="44" cy="30" r="4" fill="#ffbd2e" />
            <circle cx="60" cy="30" r="4" fill="#27ca40" />
            {/* Prompt symbol */}
            <text
              x="25"
              y="70"
              fill={CLAUDE_ORANGE}
              fontSize="24"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {">"}_
            </text>
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            transform: `translateX(${titleX}px)`,
            opacity: titleOpacity,
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              fontFamily: "system-ui, sans-serif",
              margin: 0,
              letterSpacing: -2,
            }}
          >
            <span style={{ color: CLAUDE_ORANGE }}>Claude</span> Code
          </h1>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "system-ui, sans-serif",
              margin: 0,
              letterSpacing: 1,
            }}
          >
            Anthropic's Official CLI for Claude
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
