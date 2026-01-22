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

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "timeline",
    title: "Timeline Editing",
    description: "Professional multi-track timeline",
  },
  {
    icon: "ai",
    title: "AI Powered",
    description: "Text-to-video, image generation",
  },
  {
    icon: "offline",
    title: "Works Offline",
    description: "No internet required",
  },
  {
    icon: "export",
    title: "FFmpeg Export",
    description: "Professional video processing",
  },
  {
    icon: "sound",
    title: "Sound Library",
    description: "Built-in audio search",
  },
  {
    icon: "text",
    title: "Text Overlays",
    description: "Animated captions & titles",
  },
];

const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    timeline: (
      <>
        <rect x="3" y="3" width="18" height="4" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="3" y="10" width="12" height="4" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="3" y="17" width="15" height="4" rx="1" fill="currentColor" opacity="0.4" />
      </>
    ),
    ai: (
      <>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    offline: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    export: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polyline points="7 10 12 15 17 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    sound: (
      <>
        <path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    text: (
      <>
        <polyline points="4 7 4 4 20 4 20 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" style={{ color: "white" }}>
      {icons[type]}
    </svg>
  );
};

const FeatureCard: React.FC<{
  feature: Feature;
  index: number;
  frame: number;
  fps: number;
}> = ({ feature, index, frame, fps }) => {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const delay = 10 + row * 15 + col * 8;

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);
  const translateY = interpolate(cardProgress, [0, 1], [30, 0]);

  // Shimmer effect
  const shimmerPhase = (frame + index * 15) % 90;
  const shimmerOpacity = interpolate(shimmerPhase, [0, 45, 90], [0, 0.15, 0]);

  return (
    <div
      style={{
        width: 280,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 20,
        padding: 28,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        border: "1px solid rgba(139, 92, 246, 0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Shimmer overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, transparent 0%, rgba(139, 92, 246, ${shimmerOpacity}) 50%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${QCUT_PURPLE} 0%, ${QCUT_BLUE} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <FeatureIcon type={feature.icon} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "white",
          margin: 0,
          marginBottom: 8,
          fontFamily: "system-ui",
        }}
      >
        {feature.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 16,
          color: "rgba(255, 255, 255, 0.6)",
          margin: 0,
          fontFamily: "system-ui",
          lineHeight: 1.4,
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
  const titleScale = interpolate(titleProgress, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%)
          `,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          zIndex: 1,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
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
            Powerful <span style={{ color: QCUT_PURPLE }}>Features</span>
          </h2>
        </div>

        {/* Features grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 24,
            maxWidth: 950,
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
      </div>
    </AbsoluteFill>
  );
};
