import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./IntroScene";
import { TerminalScene } from "./TerminalScene";
import { FeaturesScene } from "./FeaturesScene";
import { CodeScene } from "./CodeScene";
import { OutroScene } from "./OutroScene";

// Scene durations in frames (at 30fps)
const INTRO_DURATION = 90; // 3 seconds
const TERMINAL_DURATION = 180; // 6 seconds
const FEATURES_DURATION = 120; // 4 seconds
const CODE_DURATION = 150; // 5 seconds
const OUTRO_DURATION = 120; // 4 seconds
const TRANSITION_DURATION = 20;

export const ClaudeCodeDemo: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Intro Scene */}
      <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
        <IntroScene />
      </TransitionSeries.Sequence>

      {/* Transition: Fade */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Terminal Scene */}
      <TransitionSeries.Sequence durationInFrames={TERMINAL_DURATION}>
        <TerminalScene />
      </TransitionSeries.Sequence>

      {/* Transition: Slide from right */}
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Features Scene */}
      <TransitionSeries.Sequence durationInFrames={FEATURES_DURATION}>
        <FeaturesScene />
      </TransitionSeries.Sequence>

      {/* Transition: Slide from bottom */}
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Code Scene */}
      <TransitionSeries.Sequence durationInFrames={CODE_DURATION}>
        <CodeScene />
      </TransitionSeries.Sequence>

      {/* Transition: Fade */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Outro Scene */}
      <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

// Calculate total duration accounting for transition overlaps
// Total = sum of scene durations - (number of transitions * transition duration)
// 90 + 180 + 120 + 150 + 120 - (4 * 20) = 660 - 80 = 580 frames
export const TOTAL_DURATION = 580;
