import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useAudioLevel } from '@rocket.chat/ui-media';

/**
 * Three bars that rise and fall with how loudly someone is talking: whether a mic that is on is picking anything up,
 * which a static mic icon cannot say. It measures the stream it is given, or uses the level it is handed.
 */
export type VoiceActivityProps = {
	/** How loud, from 0 to 1, for a caller that already measures it — so one microphone gets one analyser. */
	level?: number;
	/** The microphone to measure, for a caller that has one but no reading of it. Ignored when `level` is given. */
	stream?: MediaStream | null;
	/** Height of the tallest a bar can be, in pixels. The bars scale with it. */
	size?: number;
	/** Draws it on a blue disc, for over a tile or beside a name; left off inside a control with its own background. */
	badge?: boolean;
	className?: string;
};

// The middle bar leads and the outer two follow at a fraction of it, which is what makes three bars read as a voice
// rather than as a progress bar.
const BAR_SCALES = [0.55, 1, 0.7];

// At rest the three are equal dots: a mic that is on and waiting. Unequal bars would claim a voice, none would read as broken.
const DOT_SIZE = 3;

const rowStyles = css`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
`;

const barStyles = css`
	width: ${DOT_SIZE}px;
	// Round, so that at rest — where all three are this wide and this tall — they are dots rather than stubs.
	border-radius: ${DOT_SIZE}px;
	background-color: currentColor;
	// Matches the level's own sampling interval, so the bars glide between readings instead of stepping.
	transition: height 80ms linear;
`;

// The same blue the tile's speaking ring uses, so the two agree about what "someone is talking" looks like.
const badgeStyles = css`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background-color: ${Palette.stroke['stroke-highlight'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;

const VoiceActivity = ({ level, stream, size = 16, badge = false, className }: VoiceActivityProps) => {
	const measured = useAudioLevel(level === undefined ? (stream ?? null) : null);
	const clamped = Math.min(Math.max(level ?? measured, 0), 1);

	const bars = (
		// Decorative: what it is saying is already said in words by whatever labels the control it sits in.
		<Box className={[rowStyles, badge ? null : className]} style={{ height: size }} aria-hidden>
			{BAR_SCALES.map((scale, index) => (
				<Box
					key={index}
					data-testid='voice-activity-bar'
					className={barStyles}
					style={{ height: Math.max(DOT_SIZE, Math.round(size * scale * clamped)) }}
				/>
			))}
		</Box>
	);

	if (!badge) {
		return bars;
	}

	// Room around the bars so the disc reads as a disc rather than as a circle drawn tight to them.
	const diameter = size + 10;

	return (
		<Box data-testid='voice-activity-badge' className={[badgeStyles, className]} style={{ width: diameter, height: diameter }}>
			{bars}
		</Box>
	);
};

export default VoiceActivity;
