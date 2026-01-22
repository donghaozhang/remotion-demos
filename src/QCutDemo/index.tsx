import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./IntroScene";
import { WhyScene } from "./WhyScene";
import { FeaturesScene } from "./FeaturesScene";
import { EditorScene } from "./EditorScene";
import { OutroScene } from "./OutroScene";

// Scene durations in frames (at 30fps)
const INTRO_DURATION = 120; // 4 seconds
const WHY_DURATION = 150; // 5 seconds
const FEATURES_DURATION = 120; // 4 seconds
const EDITOR_DURATION = 180; // 6 seconds
const OUTRO_DURATION = 120; // 4 seconds
const TRANSITION_DURATION = 20;

export const QCutDemo: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Intro Scene - Logo and tagline */}
      <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
        <IntroScene />
      </TransitionSeries.Sequence>

      {/* Transition: Fade */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Why Scene - Problems and solutions */}
      <TransitionSeries.Sequence durationInFrames={WHY_DURATION}>
        <WhyScene />
      </TransitionSeries.Sequence>

      {/* Transition: Slide from right */}
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Features Scene - Feature grid */}
      <TransitionSeries.Sequence durationInFrames={FEATURES_DURATION}>
        <FeaturesScene />
      </TransitionSeries.Sequence>

      {/* Transition: Slide from bottom */}
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Editor Scene - Timeline mockup */}
      <TransitionSeries.Sequence durationInFrames={EDITOR_DURATION}>
        <EditorScene />
      </TransitionSeries.Sequence>

      {/* Transition: Fade */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Outro Scene - CTA */}
      <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

// Calculate total duration accounting for transition overlaps
// Total = sum of scene durations - (number of transitions * transition duration)
// 120 + 150 + 120 + 180 + 120 - (4 * 20) = 690 - 80 = 610 frames
export const QCUT_TOTAL_DURATION = 610;
