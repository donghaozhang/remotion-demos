import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// macOS Light Theme Colors
const WINDOW_BG = "#FFFFFF";
const TITLEBAR_BG = "#E8E8E8";
const TITLEBAR_BORDER = "#D1D1D1";
const TERMINAL_BG = "#FFFFFF";
const TEXT_COLOR = "#1D1D1F";
const PATH_COLOR = "#5856D6";

// Window button colors
const CLOSE_BTN = "#FF5F57";
const MINIMIZE_BTN = "#FEBC2E";
const MAXIMIZE_BTN = "#28C840";

export const TerminalWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor blink animation
  const cursorOpacity = interpolate(
    frame % 30,
    [0, 15, 15.01, 30],
    [1, 1, 0, 0]
  );

  // Simple scale entrance - no rotation or floating
  const scaleProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const scale = interpolate(scaleProgress, [0, 1], [0.95, 1]);
  const opacity = interpolate(scaleProgress, [0, 1], [0, 1]);

  
  // === CONVERSATION TIMELINE ===
  const CHAR_SPEED = 2; // frames per character

  // Line 1: User types command
  const command = "npx skills add remotion-dev/remotion";
  const commandStart = 30;
  const commandChars = Math.floor(Math.max(0, frame - commandStart) / CHAR_SPEED);
  const commandText = command.slice(0, Math.min(commandChars, command.length));
  const commandDone = commandChars >= command.length;
  const commandEndFrame = commandStart + command.length * CHAR_SPEED + 20;

  // Line 2: Agent response - Installing
  const line2Start = commandEndFrame;
  const line2Text = "Installing skill from remotion-dev/remotion...";
  const line2Chars = Math.floor(Math.max(0, frame - line2Start) / 1);
  const line2Visible = frame >= line2Start;
  const line2Content = line2Text.slice(0, Math.min(line2Chars, line2Text.length));

  // Line 3: Found skill
  const line3Start = line2Start + 50;
  const line3Visible = frame >= line3Start;

  // Line 4: Downloading
  const line4Start = line3Start + 40;
  const line4Visible = frame >= line4Start;

  // Progress bar
  const progressStart = line4Start + 30;
  const progressEnd = progressStart + 60;
  const progressPercent = interpolate(
    frame,
    [progressStart, progressEnd],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const progressVisible = frame >= progressStart;

  // Line 5: Success message
  const line5Start = progressEnd + 20;
  const line5Visible = frame >= line5Start;

  // Line 6: Usage hint
  const line6Start = line5Start + 30;
  const line6Visible = frame >= line6Start;

  // Line 7: Agent asks question
  const line7Start = line6Start + 50;
  const line7Text = "Would you like me to explain the available rules?";
  const line7Chars = Math.floor(Math.max(0, frame - line7Start) / 1);
  const line7Visible = frame >= line7Start;
  const line7Content = line7Text.slice(0, Math.min(line7Chars, line7Text.length));

  // Line 8: User response
  const line8Start = line7Start + line7Text.length + 40;
  const line8Command = "yes";
  const line8Chars = Math.floor(Math.max(0, frame - line8Start) / CHAR_SPEED);
  const line8Visible = frame >= line8Start;
  const line8Content = line8Command.slice(0, Math.min(line8Chars, line8Command.length));
  const line8Done = line8Chars >= line8Command.length;

  // Line 9: Agent lists rules
  const line9Start = line8Start + line8Command.length * CHAR_SPEED + 30;
  const line9Visible = frame >= line9Start;

  // Cursor position
  const showCursorOnCommand = !commandDone && frame >= commandStart;
  const showCursorOnLine8 = line8Visible && !line8Done;
  const showCursorAtEnd = line9Visible;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(150deg, #E8F4FD 0%, #F5F5F7 50%, #FDF2F8 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      {/* Static background orbs */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
          top: "10%",
          left: "10%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.10) 0%, transparent 70%)",
          bottom: "15%",
          right: "15%",
        }}
      />

      {/* Terminal Window */}
      <div
        style={{
          width: 1100,
          height: 700,
          backgroundColor: WINDOW_BG,
          borderRadius: 12,
          boxShadow: "0 22px 70px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: 52,
            backgroundColor: TITLEBAR_BG,
            borderBottom: `1px solid ${TITLEBAR_BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            position: "relative",
          }}
        >
          {/* Window Controls */}
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: CLOSE_BTN,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: MINIMIZE_BTN,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: MAXIMIZE_BTN,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
              }}
            />
          </div>

          {/* Window Title */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#3D3D3D",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              }}
            >
              Terminal — zsh — 120×35
            </span>
          </div>
        </div>

        {/* Terminal Content */}
        <div
          style={{
            flex: 1,
            backgroundColor: TERMINAL_BG,
            padding: 20,
            fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
            fontSize: 15,
            lineHeight: 1.7,
            overflow: "hidden",
          }}
        >
          {/* Line 1: User command */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: PATH_COLOR, fontWeight: 500 }}>~/projects</span>
            <span style={{ color: TEXT_COLOR, margin: "0 8px" }}>$</span>
            <span style={{ color: TEXT_COLOR }}>{commandText}</span>
            {showCursorOnCommand && (
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 18,
                  backgroundColor: TEXT_COLOR,
                  opacity: cursorOpacity,
                  marginLeft: 1,
                }}
              />
            )}
          </div>

          {/* Line 2: Installing */}
          {line2Visible && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#007AFF" }}>●</span>
              <span style={{ color: "#6B7280" }}>{line2Content}</span>
            </div>
          )}

          {/* Line 3: Found skill */}
          {line3Visible && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#10B981" }}>✓</span>
              <span style={{ color: TEXT_COLOR }}>
                Found skill: <span style={{ color: "#7C3AED", fontWeight: 600 }}>Remotion Best Practices</span>
              </span>
            </div>
          )}

          {/* Line 4: Downloading */}
          {line4Visible && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#007AFF" }}>↓</span>
              <span style={{ color: "#6B7280" }}>Downloading 32 rules and 3 assets...</span>
            </div>
          )}

          {/* Progress bar */}
          {progressVisible && (
            <div style={{ marginTop: 8, marginLeft: 20 }}>
              <div
                style={{
                  width: 300,
                  height: 8,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    backgroundColor: "#7C3AED",
                    borderRadius: 4,
                  }}
                />
              </div>
              <span style={{ color: "#6B7280", fontSize: 12, marginTop: 4, display: "block" }}>
                {Math.round(progressPercent)}% complete
              </span>
            </div>
          )}

          {/* Line 5: Success */}
          {line5Visible && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#10B981" }}>✓</span>
              <span style={{ color: "#10B981", fontWeight: 600 }}>
                Skill installed successfully!
              </span>
            </div>
          )}

          {/* Line 6: Usage hint */}
          {line6Visible && (
            <div style={{ marginTop: 8, paddingLeft: 20 }}>
              <span style={{ color: "#6B7280" }}>
                You can now use{" "}
                <span
                  style={{
                    backgroundColor: "#F3F4F6",
                    padding: "2px 8px",
                    borderRadius: 4,
                    color: "#7C3AED",
                    fontWeight: 500,
                  }}
                >
                  /remotion-best-practices
                </span>
                {" "}in your conversations
              </span>
            </div>
          )}

          {/* Line 7: Agent question */}
          {line7Visible && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                borderLeft: "3px solid #7C3AED",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    backgroundColor: "#7C3AED",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Agent
                </span>
              </div>
              <span style={{ color: TEXT_COLOR }}>{line7Content}</span>
            </div>
          )}

          {/* Line 8: User response */}
          {line8Visible && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center" }}>
              <span style={{ color: PATH_COLOR, fontWeight: 500 }}>~/projects</span>
              <span style={{ color: TEXT_COLOR, margin: "0 8px" }}>$</span>
              <span style={{ color: TEXT_COLOR }}>{line8Content}</span>
              {showCursorOnLine8 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 18,
                    backgroundColor: TEXT_COLOR,
                    opacity: cursorOpacity,
                    marginLeft: 1,
                  }}
                />
              )}
            </div>
          )}

          {/* Line 9: Agent lists rules */}
          {line9Visible && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                borderLeft: "3px solid #7C3AED",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    backgroundColor: "#7C3AED",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Agent
                </span>
              </div>
              <span style={{ color: TEXT_COLOR }}>Here are the available rules:</span>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["animations", "timing", "sequencing", "transitions", "audio", "fonts", "3d"].map((rule, i) => (
                  <span
                    key={rule}
                    style={{
                      backgroundColor: "#EDE9FE",
                      color: "#7C3AED",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      opacity: interpolate(
                        frame - line9Start - i * 5,
                        [0, 10],
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                      ),
                    }}
                  >
                    {rule}
                  </span>
                ))}
                <span style={{ color: "#6B7280", fontSize: 13 }}>...and 25 more</span>
              </div>
              {showCursorAtEnd && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 18,
                    backgroundColor: TEXT_COLOR,
                    opacity: cursorOpacity,
                    marginLeft: 4,
                    marginTop: 8,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
