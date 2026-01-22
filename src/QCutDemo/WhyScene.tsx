import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const QCUT_PURPLE = "#8B5CF6";
const DARK_BG = "#0f0f1a";

interface Problem {
  icon: string;
  problem: string;
  solution: string;
}

const problems: Problem[] = [
  {
    icon: "lock",
    problem: "Privacy concerns with cloud editors",
    solution: "All processing happens locally",
  },
  {
    icon: "dollar",
    problem: "Basic features behind paywalls",
    solution: "Every feature is completely free",
  },
  {
    icon: "puzzle",
    problem: "Overcomplicated interfaces",
    solution: "Simple, intuitive design",
  },
];

const ProblemIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    lock: (
      <path
        d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-7a4 4 0 0 1 4 4v3H8V8a4 4 0 0 1 4-4z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    dollar: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    puzzle: (
      <path
        d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.878-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.878.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" style={{ color: QCUT_PURPLE }}>
      {icons[type]}
    </svg>
  );
};

const ProblemCard: React.FC<{
  item: Problem;
  index: number;
  frame: number;
  fps: number;
}> = ({ item, index, frame, fps }) => {
  const delay = 20 + index * 20;

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15 },
  });

  const translateX = interpolate(cardProgress, [0, 1], [-50, 0]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  // Strike through animation for problem
  const strikeDelay = delay + 30;
  const strikeProgress = spring({
    frame: frame - strikeDelay,
    fps,
    config: { damping: 20 },
  });
  const strikeWidth = interpolate(strikeProgress, [0, 1], [0, 100]);

  // Solution fade in
  const solutionOpacity = interpolate(strikeProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "20px 0",
        borderBottom: index < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ProblemIcon type={item.icon} />
      </div>

      {/* Text content */}
      <div style={{ flex: 1 }}>
        {/* Problem with strikethrough */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              fontFamily: "system-ui",
              textDecoration: strikeWidth > 50 ? "line-through" : "none",
              opacity: strikeWidth > 50 ? 0.4 : 1,
            }}
          >
            {item.problem}
          </p>
        </div>

        {/* Solution */}
        <p
          style={{
            fontSize: 24,
            color: "#7EE787",
            margin: 0,
            fontFamily: "system-ui",
            fontWeight: 600,
            opacity: solutionOpacity,
          }}
        >
          {item.solution}
        </p>
      </div>

      {/* Checkmark */}
      <div
        style={{
          opacity: solutionOpacity,
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "rgba(126, 231, 135, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polyline
            points="20 6 9 17 4 12"
            stroke="#7EE787"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export const WhyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 15 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [-20, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        padding: 80,
      }}
    >
      {/* Subtle gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 50,
        }}
      >
        <h2
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            margin: 0,
            fontFamily: "system-ui",
          }}
        >
          Why <span style={{ color: QCUT_PURPLE }}>QCut</span>?
        </h2>
      </div>

      {/* Problems list */}
      <div
        style={{
          maxWidth: 900,
        }}
      >
        {problems.map((item, index) => (
          <ProblemCard
            key={index}
            item={item}
            index={index}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
