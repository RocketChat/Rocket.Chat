import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette, borderRadius } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import VoiceActivity from '../VoiceActivity';
import { useSpeakingRing } from '../hooks/useSpeakingRing';
import { speakingRingThickness } from '../lib/speakingRing';
import type { TileParticipant } from '../lib/stageTiles';

const tileStyles = css`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border-radius: ${borderRadius('large')};
	container-type: inline-size;
	color: ${Palette.text['font-pure-white'].toString()};
`;

/**
 * The name over the tile: plain text on the picture, with a shadow to hold it there.
 *
 * No plate behind it. A dark pill under every name put a permanent rectangle over the bottom of everyone's camera,
 * and the shadow does the one job the plate was there for — keeping the name legible over whatever the camera
 * happens to be showing, light or dark — without covering any of it. The padding stays even with nothing to pad,
 * so the name holds its position when a raised hand gives it a plate again rather than shifting under the reader.
 */
const labelStyles = css`
	position: absolute;
	left: 0.5rem;
	bottom: 0.25rem;
	padding: 0 0.5rem;
	border-radius: ${borderRadius('medium')};
	color: ${Palette.text['font-pure-white'].toString()};
	/* Fixed, not themed: it holds the name over camera frames, which are the same colours in every theme. */
	text-shadow:
		0 1px 2px rgba(0, 0, 0, 0.6),
		0 0 2px rgba(0, 0, 0, 0.3);
	max-width: calc(100% - 1rem);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;
`;

const sendBadgeStyles = css`
	position: absolute;
	top: 0.25rem;
	left: 0.25rem;
	padding: 0.125rem 0.25rem;
	border-radius: ${borderRadius('medium')};
	background-color: ${Palette.surface['surface-overlay'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
	font-variant-numeric: tabular-nums;
	pointer-events: none;
`;

const indicatorRowStyles = css`
	position: absolute;
	top: 0.25rem;
	right: 0.25rem;
	display: flex;
	gap: 0.25rem;
	pointer-events: none;
`;

const indicatorBadgeStyles = css`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border-radius: 50%;
	background-color: ${Palette.surface['surface-overlay'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;

const handRaisedLabelStyles = css`
	/* Palette carries no button colours: this is the token fuselage's success button is drawn with. */
	background-color: var(--rcx-color-button-background-success-default);
	padding: 0.25rem 0.75rem;
	border-radius: ${borderRadius('full')};
	text-shadow: none;
`;

export type TileFrameProps = Pick<TileParticipant, 'displayName' | 'muted' | 'held' | 'audioStream' | 'handPosition'> & {
	/** How wide the speaking ring gets at full volume. */
	ringWidth: number;
	/**
	 * The height of the picture actually being sent, shown as a badge. Only for the reader's own tile: what someone
	 * else's encoder is doing is not something this client can honestly claim.
	 */
	sendHeight?: number;
	/** The picture: their camera, or their avatar. */
	children: ReactNode;
};

/** Everything a tile says over the picture: who it is, whether they are speaking, their microphone, their hand. */
const TileFrame = ({ displayName, muted, held, audioStream, handPosition, ringWidth, sendHeight, children }: TileFrameProps) => {
	const { audioLevel: rawLevel, ringLevel: displayLevel } = useSpeakingRing(audioStream ?? null, muted);
	const ringThickness = speakingRingThickness(displayLevel, ringWidth);
	const ringColor = Palette.stroke['stroke-highlight'].toString();

	return (
		<Box className={tileStyles}>
			{displayLevel > 0 && (
				<Box
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: 'inherit',
						border: `${ringThickness}px solid ${ringColor}`,
						boxShadow: `inset 0 0 ${ringThickness * 3}px color-mix(in srgb, ${ringColor} 25%, transparent)`,
						pointerEvents: 'none',
						zIndex: 1,
					}}
				/>
			)}
			{children}
			<Box className={[labelStyles, handPosition !== undefined ? handRaisedLabelStyles : null]} fontScale='p1'>
				{handPosition !== undefined && (
					<>
						<span aria-hidden>✋</span> ({handPosition}){'  '}
					</>
				)}
				{displayName}
			</Box>
			{/* The corner always says something about the microphone: crossed through when it is off, and moving with
		    the voice when it is on. A crossed mic that simply disappears when someone unmutes leaves the two
		    states told by an absence, and an absence is not something a reader notices — where a mic that moves
		    when they talk also answers the question a static icon never could, which is whether it is picking
		    anything up. */}
			{/* Opposite corner from the microphone, so the two facts about this tile do not stack. What is *sent* rather
		    than what is captured: the encoder drops to a smaller layer when bandwidth or CPU says so, and a badge
		    built from the camera's setting would keep saying 1080p right through it. */}
			{sendHeight && (
				<Box className={sendBadgeStyles} fontScale='c1'>
					{sendHeight}p
				</Box>
			)}
			<Box className={indicatorRowStyles}>
				{muted ? (
					<Box className={indicatorBadgeStyles}>
						<Icon name='mic-off' size='x16' />
					</Box>
				) : (
					// Blue, like the ring this tile lights when they speak and like every other call product's own
					// version of this: it is the one thing in the corner that means "live", and the dark disc a muted
					// mic wears would say the opposite.
					<VoiceActivity level={rawLevel} size={18} badge />
				)}
				{held && (
					<Box className={indicatorBadgeStyles}>
						<Icon name='pause-shape-unfilled' size='x16' />
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default TileFrame;
