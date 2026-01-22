import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CLAUDE_ORANGE = "#E87B35";
const DARK_BG = "#1a1a2e";
const EDITOR_BG = "#0d1117";
const LINE_HIGHLIGHT = "rgba(232, 123, 53, 0.1)";

// Simulated code lines
const codeLinesBefore = [
  { num: 38, content: "  const user = await getUser(id);", type: "normal" },
  { num: 39, content: "  ", type: "normal" },
  { num: 40, content: "  // Process user data", type: "comment" },
  { num: 41, content: "  const data = user.profile;", type: "error" },
  { num: 42, content: "  return data.settings;", type: "error" },
  { num: 43, content: "}", type: "normal" },
];

const codeLinesAfter = [
  { num: 38, content: "  const user = await getUser(id);", type: "normal" },
  { num: 39, content: "  ", type: "normal" },
  { num: 40, content: "  // Process user data with null check", type: "comment" },
  { num: 41, content: "  if (!user?.profile) {", type: "added" },
  { num: 42, content: "    return null;", type: "added" },
  { num: 43, content: "  }", type: "added" },
  { num: 44, content: "  const data = user.profile;", type: "normal" },
  { num: 45, content: "  return data.settings;", type: "normal" },
  { num: 46, content: "}", type: "normal" },
];

const getColor = (type: string) => {
  switch (type) {
    case "comment":
      return "#6e7681";
    case "error":
      return "#f85149";
    case "added":
      return "#7ee787";
    default:
      return "#c9d1d9";
  }
};

const CodeLine: React.FC<{
  line: { num: number; content: string; type: string };
  highlighted?: boolean;
  opacity?: number;
}> = ({ line, highlighted = false, opacity = 1 }) => {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: highlighted ? LINE_HIGHLIGHT : "transparent",
        padding: "2px 0",
        opacity,
      }}
    >
      <span
        style={{
          width: 50,
          color: "#6e7681",
          textAlign: "right",
          paddingRight: 16,
          fontSize: 16,
          fontFamily: "'SF Mono', monospace",
          userSelect: "none",
        }}
      >
        {line.num}
      </span>
      <span
        style={{
          color: getColor(line.type),
          fontSize: 16,
          fontFamily: "'SF Mono', monospace",
        }}
      >
        {line.content}
      </span>
      {line.type === "added" && (
        <span
          style={{
            marginLeft: 8,
            color: "#7ee787",
            fontSize: 14,
          }}
        >
          +
        </span>
      )}
    </div>
  );
};

export const CodeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Editor entrance
  const editorProgress = spring({
    frame,
    fps,
    config: { damping: 15 },
  });
  const editorScale = interpolate(editorProgress, [0, 1], [0.95, 1]);
  const editorOpacity = interpolate(editorProgress, [0, 1], [0, 1]);

  // Transition from before to after code
  const transitionFrame = 60;
  const isAfter = frame >= transitionFrame;

  // Crossfade animation
  const crossfadeProgress = spring({
    frame: frame - transitionFrame,
    fps,
    config: { damping: 20 },
  });
  const beforeOpacity = interpolate(crossfadeProgress, [0, 1], [1, 0]);
  const afterOpacity = interpolate(crossfadeProgress, [0, 1], [0, 1]);

  // Status message animation
  const statusProgress = spring({
    frame: frame - transitionFrame - 20,
    fps,
    config: { damping: 15 },
  });
  const statusOpacity = interpolate(statusProgress, [0, 1], [0, 1]);
  const statusY = interpolate(statusProgress, [0, 1], [10, 0]);


  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "white",
            margin: 0,
            fontFamily: "system-ui",
            opacity: editorOpacity,
          }}
        >
          Intelligent <span style={{ color: CLAUDE_ORANGE }}>Code Editing</span>
        </h2>
      </div>

      {/* Code editor */}
      <div
        style={{
          width: "85%",
          maxWidth: 900,
          backgroundColor: EDITOR_BG,
          borderRadius: 12,
          overflow: "hidden",
          transform: `scale(${editorScale})`,
          opacity: editorOpacity,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          marginTop: 40,
        }}
      >
        {/* Editor title bar */}
        <div
          style={{
            backgroundColor: "#161b22",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1px solid #30363d",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27ca40" }} />
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              marginLeft: 12,
              fontFamily: "system-ui",
            }}
          >
            src/auth.ts
          </span>
        </div>

        {/* Editor content */}
        <div style={{ padding: "16px 8px", position: "relative", minHeight: 280 }}>
          {/* Before code */}
          <div style={{ position: "absolute", top: 16, left: 8, right: 8, opacity: beforeOpacity }}>
            {codeLinesBefore.map((line) => (
              <CodeLine
                key={`before-${line.num}`}
                line={line}
                highlighted={line.type === "error"}
              />
            ))}
          </div>

          {/* After code */}
          <div style={{ position: "absolute", top: 16, left: 8, right: 8, opacity: afterOpacity }}>
            {codeLinesAfter.map((line) => (
              <CodeLine
                key={`after-${line.num}`}
                line={line}
                highlighted={line.type === "added"}
                opacity={line.type === "added" ? 1 : 1}
              />
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            backgroundColor: "#161b22",
            padding: "8px 16px",
            borderTop: "1px solid #30363d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAfter ? (
              <div
                style={{
                  opacity: statusOpacity,
                  transform: `translateY(${statusY}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#7ee787",
                  }}
                />
                <span style={{ color: "#7ee787", fontSize: 14, fontFamily: "system-ui" }}>
                  Fixed: Added null check for user.profile
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#f85149",
                  }}
                />
                <span style={{ color: "#f85149", fontSize: 14, fontFamily: "system-ui" }}>
                  Error: Potential null reference on line 41-42
                </span>
              </div>
            )}
          </div>
          <span style={{ color: "#6e7681", fontSize: 12, fontFamily: "system-ui" }}>
            TypeScript
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
