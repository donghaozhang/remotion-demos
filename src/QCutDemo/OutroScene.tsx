import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const QCUT_PURPLE = "#8B5CF6";
const QCUT_BLUE = "#3B82F6";
const DARK_BG = "#0f0f1a";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12 },
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  // Title animation
  const titleProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // Command animation
  const commandProgress = spring({
    frame: frame - 35,
    fps,
    config: { damping: 15 },
  });
  const commandOpacity = interpolate(commandProgress, [0, 1], [0, 1]);
  const commandScale = interpolate(commandProgress, [0, 1], [0.95, 1]);

  // Links animation
  const linksProgress = spring({
    frame: frame - 55,
    fps,
    config: { damping: 15 },
  });
  const linksOpacity = interpolate(linksProgress, [0, 1], [0, 1]);

  // Pulsing glow
  const glowPhase = frame % 60;
  const glowIntensity = interpolate(glowPhase, [0, 30, 60], [0.3, 0.6, 0.3]);

  // Fade out
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
      {/* Animated background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(circle at 30% 30%, rgba(139, 92, 246, ${glowIntensity * 0.15}) 0%, transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(59, 130, 246, ${glowIntensity * 0.15}) 0%, transparent 40%)
          `,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          <svg width="100" height="100" viewBox="0 0 140 140">
            <defs>
              <linearGradient id="outroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={QCUT_PURPLE} />
                <stop offset="100%" stopColor={QCUT_BLUE} />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="65" fill="url(#outroGradient)" />
            <polygon points="55,45 55,95 95,70" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 800,
              margin: 0,
              fontFamily: "system-ui",
              background: `linear-gradient(135deg, ${QCUT_PURPLE} 0%, ${QCUT_BLUE} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Start Editing Today
          </h1>
          <p
            style={{
              fontSize: 26,
              color: "rgba(255, 255, 255, 0.7)",
              margin: "12px 0 0 0",
              fontFamily: "system-ui",
            }}
          >
            Free. Open Source. Private.
          </p>
        </div>

        {/* Clone command */}
        <div
          style={{
            opacity: commandOpacity,
            transform: `scale(${commandScale})`,
            marginTop: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 12,
              padding: "18px 36px",
              border: `2px solid rgba(139, 92, 246, ${0.4 + glowIntensity * 0.3})`,
              boxShadow: `0 0 50px rgba(139, 92, 246, ${glowIntensity * 0.25})`,
            }}
          >
            <code
              style={{
                fontSize: 22,
                fontFamily: "'SF Mono', Monaco, monospace",
                color: "white",
              }}
            >
              <span style={{ color: "#7EE787" }}>$</span>{" "}
              <span style={{ color: QCUT_PURPLE }}>git clone</span>{" "}
              <span style={{ color: "#79c0ff" }}>https://github.com/donghaozhang/qcut</span>
            </code>
          </div>
        </div>

        {/* Links */}
        <div
          style={{
            opacity: linksOpacity,
            display: "flex",
            gap: 40,
            marginTop: 20,
          }}
        >
          {[
            { icon: "github", text: "GitHub" },
            { icon: "docs", text: "Documentation" },
            { icon: "download", text: "Download" },
          ].map((link) => (
            <div
              key={link.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {link.icon === "github" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                {link.icon === "docs" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                )}
                {link.icon === "download" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
              </div>
              <span
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 18,
                  fontFamily: "system-ui",
                  fontWeight: 500,
                }}
              >
                {link.text}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            opacity: linksOpacity,
            marginTop: 30,
          }}
        >
          <p
            style={{
              fontSize: 16,
              color: "rgba(255, 255, 255, 0.4)",
              margin: 0,
              fontFamily: "system-ui",
            }}
          >
            Made with React + Electron + FFmpeg
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
