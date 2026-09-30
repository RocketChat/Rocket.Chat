import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';

import { useAudioLevel } from '../providers/useAudioLevel';

/**
 * Three bars that rise and fall with how loudly someone is talking.
 *
 * It answers a question a microphone icon cannot: whether a mic that is *on* is actually picking anything up. A
 * static mic icon looks identical whether someone is mid-sentence or has walked away, which is why every call
 * product animates this instead — and why it stands in for the mic icon wherever the mic is live rather than
 * sitting beside it.
 *
 * Give it a microphone and it measures one for itself; give it a level and it uses that. Both, because a tile
 * already measures its own to light its speaking ring — passing that reading in means one analyser on that
 * microphone rather than two — while a members list has streams and no readings, and should not have to grow an
 * analyser of its own to draw three bars.
 */
export type VoiceActivityProps = {
	/**
	 * How loud, from 0 to 1, when the caller already knows — a tile lighting its speaking ring measures this
	 * anyway, and passing it here means one analyser on that microphone rather than two.
	 */
	level?: number;
	/** The microphone to measure, for a caller that has one but no reading of it. Ignored when `level` is given. */
	stream?: MediaStream | null;
	/** Height of the tallest a bar can be, in pixels. The bars scale with it. */
	size?: number;
	/**
	 * Draws it on a blue disc, the way a call puts it over a tile or beside a name. Left off where it sits inside a
	 * control that has a background of its own already — a button, say.
	 */
	badge?: boolean;
	className?: string;
};

// The middle bar leads and the outer two follow at a fraction of it, which is what makes three bars read as a voice
// rather than as a progress bar.
const BAR_SCALES = [0.55, 1, 0.7];

// With nothing to hear the three are equal, which reads as a row of dots: a mic that is on and waiting. Unequal
// bars at rest read as a voice that is being picked up, which would be a lie in a silent room — and nothing at all
// would read as broken.
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
	// Called unconditionally, as hooks must be; it costs nothing when there is no stream to measure.
	const measured = useAudioLevel(level === undefined ? (stream ?? null) : null);
	const clamped = Math.min(Math.max(level ?? measured, 0), 1);

	const bars = (
		// Decorative: what it is saying is already said in words by whatever labels the control it sits in.
		<Box className={[rowStyles, badge ? null : className]} style={{ height: size }} aria-hidden>
			{BAR_SCALES.map((scale, index) => (
				<Box key={index} className={barStyles} style={{ height: Math.max(DOT_SIZE, Math.round(size * scale * clamped)) }} />
			))}
		</Box>
	);

	if (!badge) {
		return bars;
	}

	// Room around the bars so the disc reads as a disc rather than as a circle drawn tight to them.
	const diameter = size + 10;

	return (
		<Box className={[badgeStyles, className]} style={{ width: diameter, height: diameter }}>
			{bars}
		</Box>
	);
};

export default VoiceActivity;
