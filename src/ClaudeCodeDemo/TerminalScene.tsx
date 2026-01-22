import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CLAUDE_ORANGE = "#E87B35";
const DARK_BG = "#1a1a2e";
const TERMINAL_BG = "#0d1117";
const TERMINAL_BORDER = "#30363d";

const CHAR_FRAMES = 2;
const CURSOR_BLINK_FRAMES = 20;

const getTypedText = (frame: number, text: string, startFrame: number): string => {
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.floor(elapsed / CHAR_FRAMES);
  return text.slice(0, Math.min(chars, text.length));
};

const Cursor: React.FC<{ frame: number; visible: boolean }> = ({ frame, visible }) => {
  if (!visible) return null;
  const opacity = interpolate(
    frame % CURSOR_BLINK_FRAMES,
    [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
    [1, 0, 1]
  );
  return <span style={{ opacity, color: CLAUDE_ORANGE }}>|</span>;
};

export const TerminalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Terminal entrance animation
  const terminalProgress = spring({
    frame,
    fps,
    config: { damping: 15 },
  });
  const terminalScale = interpolate(terminalProgress, [0, 1], [0.9, 1]);
  const terminalOpacity = interpolate(terminalProgress, [0, 1], [0, 1]);

  // Command typing timings
  const command1Start = 20;
  const command1 = "claude";
  const command1Typed = getTypedText(frame, command1, command1Start);
  const command1Done = frame >= command1Start + command1.length * CHAR_FRAMES + 10;

  const response1Start = command1Start + command1.length * CHAR_FRAMES + 15;
  const response1Done = frame >= response1Start + 30;

  const command2Start = response1Start + 60;
  const command2 = 'claude "Fix the bug in auth.ts"';
  const command2Typed = getTypedText(frame, command2, command2Start);
  const command2Done = frame >= command2Start + command2.length * CHAR_FRAMES + 10;

  // Response animation
  const responseProgress = spring({
    frame: frame - response1Start,
    fps,
    config: { damping: 20 },
  });
  const responseOpacity = interpolate(responseProgress, [0, 1], [0, 1]);

  // Processing animation
  const processingProgress = spring({
    frame: frame - (command2Start + command2.length * CHAR_FRAMES + 15),
    fps,
    config: { damping: 20 },
  });
  const processingOpacity = interpolate(processingProgress, [0, 1], [0, 1]);

  // Dots animation for loading
  const dots = ".".repeat((Math.floor(frame / 10) % 4));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Terminal window */}
      <div
        style={{
          width: "90%",
          maxWidth: 1000,
          backgroundColor: TERMINAL_BG,
          borderRadius: 12,
          border: `1px solid ${TERMINAL_BORDER}`,
          overflow: "hidden",
          transform: `scale(${terminalScale})`,
          opacity: terminalOpacity,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            backgroundColor: "#161b22",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: `1px solid ${TERMINAL_BORDER}`,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27ca40" }} />
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              marginLeft: 12,
              fontFamily: "system-ui",
            }}
          >
            Terminal - Claude Code
          </span>
        </div>

        {/* Terminal content */}
        <div
          style={{
            padding: 24,
            fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
            fontSize: 20,
            lineHeight: 1.6,
          }}
        >
          {/* First command */}
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <span style={{ color: "#7ee787" }}>~</span>
            <span style={{ color: "#79c0ff" }}> $ </span>
            <span style={{ color: "white" }}>{command1Typed}</span>
            <Cursor frame={frame} visible={!command1Done} />
          </div>

          {/* Response */}
          {command1Done && (
            <div style={{ opacity: responseOpacity, marginTop: 16, marginBottom: 16 }}>
              <div style={{ color: CLAUDE_ORANGE, marginBottom: 8 }}>
                Welcome to Claude Code v1.0
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
                Type your request, or use /help for commands
              </div>
            </div>
          )}

          {/* Second command */}
          {response1Done && (
            <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 20 }}>
              <span style={{ color: "#7ee787" }}>~</span>
              <span style={{ color: "#79c0ff" }}> $ </span>
              <span style={{ color: "white" }}>{command2Typed}</span>
              <Cursor frame={frame} visible={!command2Done} />
            </div>
          )}

          {/* Processing response */}
          {command2Done && (
            <div style={{ opacity: processingOpacity, marginTop: 16 }}>
              <div style={{ color: CLAUDE_ORANGE, display: "flex", alignItems: "center", gap: 8 }}>
                <span>Analyzing code{dots}</span>
              </div>
              <div style={{ color: "#7ee787", marginTop: 12 }}>
                Reading src/auth.ts
              </div>
              <div style={{ color: "#7ee787", marginTop: 4 }}>
                Found issue: Missing null check on line 42
              </div>
              <div style={{ color: "#79c0ff", marginTop: 4 }}>
                Applying fix...
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
