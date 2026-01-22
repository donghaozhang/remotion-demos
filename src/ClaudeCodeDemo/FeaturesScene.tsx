import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CLAUDE_ORANGE = "#E87B35";
const DARK_BG = "#1a1a2e";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "Edit",
    title: "Code Editing",
    description: "Intelligent file editing with context awareness",
  },
  {
    icon: "Terminal",
    title: "Bash Commands",
    description: "Execute shell commands safely in sandbox",
  },
  {
    icon: "Search",
    title: "Codebase Search",
    description: "Find and understand code across your project",
  },
  {
    icon: "Git",
    title: "Git Integration",
    description: "Commits, PRs, and version control",
  },
];

const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconPaths: Record<string, React.ReactNode> = {
    Edit: (
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    Terminal: (
      <>
        <polyline
          points="4 17 10 11 4 5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="12"
          y1="19"
          x2="20"
          y2="19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    Search: (
      <>
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <line
          x1="21"
          y1="21"
          x2="16.65"
          y2="16.65"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    Git: (
      <>
        <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path
          d="M13 6h3a2 2 0 0 1 2 2v7M6 9v12"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  };

  return (
    <svg width="32" height="32" viewBox="0 0 24 24" style={{ color: CLAUDE_ORANGE }}>
      {iconPaths[type]}
    </svg>
  );
};

const FeatureCard: React.FC<{
  feature: Feature;
  index: number;
  frame: number;
  fps: number;
}> = ({ feature, index, frame, fps }) => {
  const delay = index * 12;

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15 },
  });

  const translateY = interpolate(cardProgress, [0, 1], [50, 0]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);
  const scale = interpolate(cardProgress, [0, 1], [0.9, 1]);

  // Hover-like effect based on frame
  const hoverPhase = (frame + index * 20) % 120;
  const glowOpacity = interpolate(hoverPhase, [0, 60, 120], [0.05, 0.15, 0.05]);

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: 28,
        width: 400,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        border: `1px solid rgba(232, 123, 53, ${glowOpacity + 0.1})`,
        boxShadow: `0 0 30px rgba(232, 123, 53, ${glowOpacity})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: "rgba(232, 123, 53, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FeatureIcon type={feature.icon} />
        </div>
        <h3
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "white",
            margin: 0,
            fontFamily: "system-ui",
          }}
        >
          {feature.title}
        </h3>
      </div>
      <p
        style={{
          fontSize: 18,
          color: "rgba(255,255,255,0.6)",
          margin: 0,
          fontFamily: "system-ui",
          lineHeight: 1.5,
        }}
      >
        {feature.description}
      </p>
    </div>
  );
};

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 15 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [-30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        padding: 60,
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          background: `linear-gradient(135deg, transparent 0%, rgba(232, 123, 53, 0.03) 100%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 50,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            margin: 0,
            fontFamily: "system-ui",
          }}
        >
          Powerful <span style={{ color: CLAUDE_ORANGE }}>Features</span>
        </h2>
      </div>

      {/* Features grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 30,
          marginTop: 20,
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
