/* eslint-disable no-nested-ternary */
import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon, Palette } from '@rocket.chat/fuselage';
import { memo, useEffect, useRef, useState } from 'react';

import VoiceActivity from '../../components/VoiceActivity';
import { useAudioLevel } from '../../providers/useAudioLevel';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';
import { useStreamHasLiveVideo } from '../../providers/useStreamHasLiveVideo';

// Above this normalised audio level the speaking ring becomes visible. Keeps
// background noise / fan hum from constantly lighting the border. Tuned for
// the sublinear (pow 0.65) curve in useAudioLevel — higher than a linear
// formula would need because the curve lifts quiet signals.
const SPEAKING_THRESHOLD = 0.2;
// Minimum visible intensity for the speaking ring. Anything above threshold
// maps to at least this much display level so the border is clearly visible
// even on the quietest speech — without this, levels just over the threshold
// produce a near-invisible 1px ring.
const MIN_VISIBLE_RING = 0.55;
// After speech drops below threshold, keep the ring visible at the last
// active level for this long before clearing it. Avoids a flickery indicator
// during natural pauses between words.
const SPEAKING_HOLD_MS = 1000;

const tileStyles = css`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border-radius: 6px;
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
	left: 8px;
	bottom: 6px;
	padding: 2px 8px;
	border-radius: 4px;
	color: white;
	font-size: 16px;
	line-height: 20px;
	text-shadow:
		0 1px 2px rgba(0, 0, 0, 0.6),
		0 0 2px rgba(0, 0, 0, 0.3);
	max-width: calc(100% - 16px);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;
`;

const sendBadgeStyles = css`
	position: absolute;
	top: 6px;
	left: 6px;
	padding: 2px 6px;
	border-radius: 4px;
	background-color: rgba(0, 0, 0, 0.55);
	color: white;
	font-size: 11px;
	line-height: 16px;
	font-variant-numeric: tabular-nums;
	pointer-events: none;
`;

const indicatorRowStyles = css`
	position: absolute;
	top: 6px;
	right: 6px;
	display: flex;
	gap: 4px;
	pointer-events: none;
`;

const indicatorBadgeStyles = css`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background-color: rgba(0, 0, 0, 0.55);
	color: white;
`;

const handRaisedLabelStyles = css`
	background-color: var(--rcx-color-button-background-success-default, #148660);
	padding: 4px 12px;
	border-radius: 16px;
	text-shadow: none;
`;

const avatarBackdropStyles = css`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	pointer-events: none;
	filter: blur(15cqw);
`;

const avatarBackdropOverlayStyles = css`
	position: absolute;
	inset: 0;
	pointer-events: none;
`;

const BACKDROP_TINTS = ['#5f141480', '#1a3a5f80', '#145f2a80', '#5f4a1480', '#3a145f80'];

const nameToTint = (name: string): string => {
	let h = 0;
	for (let i = 0; i < name.length; i++) {
		h = (h * 31 + name.charCodeAt(i)) | 0;
	}
	return BACKDROP_TINTS[Math.abs(h) % BACKDROP_TINTS.length];
};

type CallTileProps = {
	displayName: string;
	avatarUrl?: string;
	muted?: boolean;
	held?: boolean;
	cameraStream?: MediaStream | null;
	/** Microphone MediaStream — drives the speaking indicator. */
	audioStream?: MediaStream | null;
	/** Renders the camera flipped (use for the local participant). */
	mirrored?: boolean;
	/** When true, the embedded video element is muted (use for local self-view). */
	muteVideoAudio?: boolean;
	/** Smaller avatar; used in the spotlight thumbnail rail. */
	compact?: boolean;
	/** When defined, render the raise-hand badge with this queue position (1-based). */
	handPosition?: number;
	/**
	 * The height of the picture actually being sent, shown as a badge. Only ever set on the reader's own tile: what
	 * someone else's encoder is doing is not something this client can honestly claim.
	 */
	sendHeight?: number;
};

const CallTile = memo(
	({
		displayName,
		avatarUrl,
		muted,
		held,
		cameraStream,
		audioStream,
		mirrored,
		muteVideoAudio,
		compact,
		handPosition,
		sendHeight,
	}: CallTileProps) => {
		const [videoRef] = usePlayMediaStream(cameraStream ?? null);
		// Camera is "active" only while a video track is actually producing frames
		// — having a MediaStream object isn't enough. When the user toggles the
		// camera off, the track is muted/disabled but the stream reference stays,
		// which used to leave the tile black; now we fall back to the avatar.
		const cameraActive = useStreamHasLiveVideo(cameraStream);
		const avatarSize = compact ? 'x32' : 'x48';

		// Speaking ring scales with audio RMS. Muted tiles never light up — a
		// muted mic shouldn't visually "speak" even if there's residual signal.
		// Anything over the threshold maps into [MIN_VISIBLE_RING, 1] so a quiet
		// tail of speech still shows a clearly-visible border instead of a 1px hint.
		const rawLevel = useAudioLevel(muted ? null : (audioStream ?? null));
		const activeLevel =
			rawLevel > SPEAKING_THRESHOLD
				? MIN_VISIBLE_RING + (1 - MIN_VISIBLE_RING) * Math.min(1, (rawLevel - SPEAKING_THRESHOLD) / (1 - SPEAKING_THRESHOLD))
				: 0;

		// Display value lingers for SPEAKING_HOLD_MS after speech stops so the ring
		// doesn't flicker on / off between words. While active, display tracks the
		// current level live; once it drops to 0, a timer holds the last visible
		// level then clears it.
		const [displayLevel, setDisplayLevel] = useState(0);
		const heldLevelRef = useRef(0);
		useEffect(() => {
			if (activeLevel > 0) {
				heldLevelRef.current = activeLevel;
				setDisplayLevel(activeLevel);
				return;
			}
			if (heldLevelRef.current === 0) return;
			const handle = setTimeout(() => {
				heldLevelRef.current = 0;
				setDisplayLevel(0);
			}, SPEAKING_HOLD_MS);
			return () => clearTimeout(handle);
		}, [activeLevel]);

		const ringThickness = Math.round(displayLevel * (compact ? 3 : 4));
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
							boxShadow: `inset 0 0 ${ringThickness * 3}px ${ringColor}40`,
							pointerEvents: 'none',
							zIndex: 1,
						}}
					/>
				)}
				{cameraActive ? (
					<video
						ref={videoRef}
						preload='metadata'
						muted={muteVideoAudio}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: mirrored ? 'scaleX(-1)' : undefined,
						}}
					>
						<track kind='captions' />
					</video>
				) : avatarUrl ? (
					<>
						<Box is='img' src={avatarUrl} alt='' className={avatarBackdropStyles} />
						<Box className={avatarBackdropOverlayStyles} style={{ backgroundColor: nameToTint(displayName) }} />
						<Avatar url={avatarUrl} size={avatarSize} />
					</>
				) : (
					<Icon name='user' size={avatarSize} />
				)}
				<Box className={[labelStyles, handPosition !== undefined ? handRaisedLabelStyles : null]}>
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
				{sendHeight && <Box className={sendBadgeStyles}>{sendHeight}p</Box>}
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
	},
);

CallTile.displayName = 'CallTile';

export default CallTile;
