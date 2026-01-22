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
const EDITOR_BG = "#18181b";
const TRACK_BG = "#27272a";

// Mock timeline clips
const videoClips = [
  { start: 0, width: 180, color: QCUT_PURPLE, label: "Intro" },
  { start: 190, width: 240, color: QCUT_BLUE, label: "Main" },
  { start: 440, width: 120, color: "#10B981", label: "Outro" },
];

const audioClips = [
  { start: 0, width: 560, color: "#F59E0B", label: "Background Music" },
];

const textClips = [
  { start: 50, width: 100, color: "#EC4899", label: "Title" },
  { start: 200, width: 150, color: "#EC4899", label: "Subtitle" },
];

export const EditorScene: React.FC = () => {
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

  // Playhead animation - moves across timeline
  const playheadPosition = interpolate(frame, [30, 180], [0, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Preview area animation
  const previewProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20 },
  });
  const previewOpacity = interpolate(previewProgress, [0, 1], [0, 1]);

  // Track animations
  const videoTrackProgress = spring({ frame: frame - 20, fps, config: { damping: 15 } });
  const audioTrackProgress = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const textTrackProgress = spring({ frame: frame - 40, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: editorOpacity,
        }}
      >
        <h2
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "white",
            margin: 0,
            fontFamily: "system-ui",
          }}
        >
          Professional <span style={{ color: QCUT_PURPLE }}>Timeline Editor</span>
        </h2>
      </div>

      {/* Editor mockup */}
      <div
        style={{
          width: "95%",
          maxWidth: 1100,
          backgroundColor: EDITOR_BG,
          borderRadius: 16,
          overflow: "hidden",
          transform: `scale(${editorScale})`,
          opacity: editorOpacity,
          boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
          marginTop: 30,
        }}
      >
        {/* Top toolbar */}
        <div
          style={{
            height: 50,
            backgroundColor: "#09090b",
            borderBottom: "1px solid #27272a",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 20,
          }}
        >
          {/* Window controls */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27ca40" }} />
          </div>

          {/* Toolbar items */}
          <div style={{ display: "flex", gap: 16, marginLeft: 20 }}>
            {["Import", "Export", "Effects", "Audio"].map((item) => (
              <span
                key={item}
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  fontFamily: "system-ui",
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Project name */}
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              fontFamily: "system-ui",
            }}
          >
            My Project.qcut
          </span>
        </div>

        {/* Main content area */}
        <div style={{ display: "flex", height: 400 }}>
          {/* Media panel */}
          <div
            style={{
              width: 200,
              backgroundColor: "#09090b",
              borderRight: "1px solid #27272a",
              padding: 12,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "system-ui" }}>
              MEDIA
            </span>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {["video_001.mp4", "audio_bg.mp3", "title.png"].map((file) => (
                <div
                  key={file}
                  style={{
                    backgroundColor: "#27272a",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "system-ui",
                  }}
                >
                  {file}
                </div>
              ))}
            </div>
          </div>

          {/* Preview area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#000",
              opacity: previewOpacity,
            }}
          >
            <div
              style={{
                width: 400,
                height: 225,
                backgroundColor: "#1a1a2e",
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Preview content animation */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(135deg, ${QCUT_PURPLE}33 0%, ${QCUT_BLUE}33 100%)`,
                }}
              />
              <span
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: "system-ui",
                  zIndex: 1,
                }}
              >
                Preview
              </span>
            </div>
          </div>

          {/* Properties panel */}
          <div
            style={{
              width: 180,
              backgroundColor: "#09090b",
              borderLeft: "1px solid #27272a",
              padding: 12,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "system-ui" }}>
              PROPERTIES
            </span>
            <div style={{ marginTop: 12 }}>
              {[
                { label: "Duration", value: "00:30" },
                { label: "Resolution", value: "1920x1080" },
                { label: "FPS", value: "30" },
              ].map((prop) => (
                <div key={prop.label} style={{ marginBottom: 12 }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "system-ui" }}>
                    {prop.label}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "system-ui" }}>
                    {prop.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline area */}
        <div
          style={{
            height: 180,
            backgroundColor: "#09090b",
            borderTop: "1px solid #27272a",
            padding: 12,
          }}
        >
          {/* Timeline header */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 12 }}>
            {/* Play button */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: QCUT_PURPLE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: "12px solid white",
                  marginLeft: 3,
                }}
              />
            </div>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "monospace" }}>
              00:00:{String(Math.floor(frame / 3) % 30).padStart(2, "0")}
            </span>
          </div>

          {/* Timeline ruler */}
          <div style={{ marginLeft: 80, marginBottom: 8, display: "flex" }}>
            {[0, 5, 10, 15, 20, 25, 30].map((sec) => (
              <span
                key={sec}
                style={{
                  width: 80,
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
              >
                {sec}s
              </span>
            ))}
          </div>

          {/* Tracks */}
          <div style={{ position: "relative" }}>
            {/* Video track */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 36,
                marginBottom: 4,
                opacity: interpolate(videoTrackProgress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(videoTrackProgress, [0, 1], [-20, 0])}px)`,
              }}
            >
              <span style={{ width: 70, color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "system-ui" }}>
                Video
              </span>
              <div style={{ flex: 1, height: 32, backgroundColor: TRACK_BG, borderRadius: 4, position: "relative" }}>
                {videoClips.map((clip, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: clip.start,
                      width: clip.width,
                      height: "100%",
                      backgroundColor: clip.color,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                    }}
                  >
                    <span style={{ color: "white", fontSize: 11, fontFamily: "system-ui" }}>
                      {clip.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio track */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 36,
                marginBottom: 4,
                opacity: interpolate(audioTrackProgress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(audioTrackProgress, [0, 1], [-20, 0])}px)`,
              }}
            >
              <span style={{ width: 70, color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "system-ui" }}>
                Audio
              </span>
              <div style={{ flex: 1, height: 32, backgroundColor: TRACK_BG, borderRadius: 4, position: "relative" }}>
                {audioClips.map((clip, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: clip.start,
                      width: clip.width,
                      height: "100%",
                      backgroundColor: clip.color,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                    }}
                  >
                    <span style={{ color: "white", fontSize: 11, fontFamily: "system-ui" }}>
                      {clip.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text track */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 36,
                opacity: interpolate(textTrackProgress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(textTrackProgress, [0, 1], [-20, 0])}px)`,
              }}
            >
              <span style={{ width: 70, color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "system-ui" }}>
                Text
              </span>
              <div style={{ flex: 1, height: 32, backgroundColor: TRACK_BG, borderRadius: 4, position: "relative" }}>
                {textClips.map((clip, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: clip.start,
                      width: clip.width,
                      height: "100%",
                      backgroundColor: clip.color,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                    }}
                  >
                    <span style={{ color: "white", fontSize: 11, fontFamily: "system-ui" }}>
                      {clip.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Playhead */}
            <div
              style={{
                position: "absolute",
                left: 70 + playheadPosition,
                top: 0,
                width: 2,
                height: "100%",
                backgroundColor: "#FF4444",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: -6,
                  width: 0,
                  height: 0,
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: "10px solid #FF4444",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
