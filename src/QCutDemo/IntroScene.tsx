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

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation - scissors cutting motion
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoRotation = interpolate(logoProgress, [0, 1], [-45, 0]);

  // Scissors cutting animation
  const scissorAngle = interpolate(
    frame % 30,
    [0, 15, 30],
    [0, -15, 0]
  );

  // Title slide in
  const titleProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });
  const titleX = interpolate(titleProgress, [0, 1], [-100, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Tagline fade in
  const taglineProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 20 },
  });
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineProgress, [0, 1], [30, 0]);

  // Badge animations
  const badge1Progress = spring({ frame: frame - 55, fps, config: { damping: 15 } });
  const badge2Progress = spring({ frame: frame - 65, fps, config: { damping: 15 } });
  const badge3Progress = spring({ frame: frame - 75, fps, config: { damping: 15 } });

  // Gradient animation
  const gradientShift = interpolate(frame, [0, 120], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated gradient background */}
      <div
        style={{
          position: "absolute",
          width: "150%",
          height: "150%",
          background: `conic-gradient(from ${gradientShift}deg at 50% 50%,
            rgba(139, 92, 246, 0.1) 0deg,
            rgba(59, 130, 246, 0.1) 120deg,
            rgba(139, 92, 246, 0.1) 240deg,
            rgba(59, 130, 246, 0.1) 360deg)`,
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          zIndex: 1,
        }}
      >
        {/* Logo - Scissors icon */}
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
          }}
        >
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Background circle */}
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={QCUT_PURPLE} />
                <stop offset="100%" stopColor={QCUT_BLUE} />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="65" fill="url(#logoGradient)" />

            {/* Scissors blades */}
            <g transform={`translate(70, 70) rotate(${scissorAngle})`}>
              {/* Top blade */}
              <ellipse cx="-15" cy="-25" rx="20" ry="8" fill="white" transform="rotate(-30)" />
              <circle cx="-25" cy="-35" r="10" fill="none" stroke="white" strokeWidth="3" />
            </g>
            <g transform={`translate(70, 70) rotate(${-scissorAngle})`}>
              {/* Bottom blade */}
              <ellipse cx="-15" cy="25" rx="20" ry="8" fill="white" transform="rotate(30)" />
              <circle cx="-25" cy="35" r="10" fill="none" stroke="white" strokeWidth="3" />
            </g>

            {/* Play button overlay */}
            <polygon points="60,50 60,90 90,70" fill="white" opacity="0.9" />
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
              fontSize: 96,
              fontWeight: 800,
              margin: 0,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -3,
              background: `linear-gradient(135deg, ${QCUT_PURPLE} 0%, ${QCUT_BLUE} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            QCut
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
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.8)",
              fontFamily: "system-ui, sans-serif",
              margin: 0,
              fontWeight: 500,
            }}
          >
            Free, Open-Source Video Editor
          </p>
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 20,
          }}
        >
          {[
            { text: "Privacy First", progress: badge1Progress },
            { text: "No Watermarks", progress: badge2Progress },
            { text: "100% Free", progress: badge3Progress },
          ].map((badge, i) => {
            const scale = interpolate(badge.progress, [0, 1], [0.5, 1]);
            const opacity = interpolate(badge.progress, [0, 1], [0, 1]);
            return (
              <div
                key={i}
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  borderRadius: 100,
                  padding: "10px 24px",
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontFamily: "system-ui",
                    fontWeight: 500,
                  }}
                >
                  {badge.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
