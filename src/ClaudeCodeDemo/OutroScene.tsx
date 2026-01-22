import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CLAUDE_ORANGE = "#E87B35";
const DARK_BG = "#1a1a2e";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Main title animation
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 12 },
  });
  const titleScale = interpolate(titleProgress, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15 },
  });
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineProgress, [0, 1], [20, 0]);

  // Command animation
  const commandProgress = spring({
    frame: frame - 35,
    fps,
    config: { damping: 15 },
  });
  const commandOpacity = interpolate(commandProgress, [0, 1], [0, 1]);
  const commandScale = interpolate(commandProgress, [0, 1], [0.95, 1]);

  // URL animation
  const urlProgress = spring({
    frame: frame - 55,
    fps,
    config: { damping: 15 },
  });
  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1]);

  // Pulsing glow for CTA
  const glowPhase = frame % 60;
  const glowIntensity = interpolate(glowPhase, [0, 30, 60], [0.2, 0.5, 0.2]);

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Background radial gradient */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 40%, rgba(232, 123, 53, 0.15) 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Main title */}
        <div
          style={{
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "white",
              margin: 0,
              fontFamily: "system-ui",
              letterSpacing: -2,
            }}
          >
            Start with <span style={{ color: CLAUDE_ORANGE }}>Claude Code</span>
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              margin: 0,
              fontFamily: "system-ui",
              textAlign: "center",
            }}
          >
            Your AI pair programmer in the terminal
          </p>
        </div>

        {/* Install command */}
        <div
          style={{
            opacity: commandOpacity,
            transform: `scale(${commandScale})`,
            marginTop: 20,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 12,
              padding: "20px 40px",
              border: `2px solid rgba(232, 123, 53, ${0.3 + glowIntensity * 0.4})`,
              boxShadow: `0 0 40px rgba(232, 123, 53, ${glowIntensity * 0.3})`,
            }}
          >
            <code
              style={{
                fontSize: 28,
                fontFamily: "'SF Mono', Monaco, monospace",
                color: "white",
              }}
            >
              <span style={{ color: "#7ee787" }}>$</span>{" "}
              <span style={{ color: CLAUDE_ORANGE }}>npm</span>{" "}
              <span style={{ color: "white" }}>install -g</span>{" "}
              <span style={{ color: "#79c0ff" }}>@anthropic-ai/claude-code</span>
            </code>
          </div>
        </div>

        {/* URL */}
        <div style={{ opacity: urlOpacity, marginTop: 16 }}>
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              fontFamily: "system-ui",
            }}
          >
            Learn more at{" "}
            <span style={{ color: CLAUDE_ORANGE }}>claude.ai/code</span>
          </p>
        </div>

        {/* Anthropic logo placeholder */}
        <div style={{ opacity: urlOpacity, marginTop: 30 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: CLAUDE_ORANGE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: "system-ui",
                }}
              >
                A
              </span>
            </div>
            <span
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,0.6)",
                fontFamily: "system-ui",
                fontWeight: 500,
              }}
            >
              Anthropic
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
