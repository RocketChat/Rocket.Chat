/* eslint-disable no-nested-ternary */
import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon, Palette } from '@rocket.chat/fuselage';
import { useEffect, useRef, useState } from 'react';

import { useAudioLevel } from '../../providers/useAudioLevel';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';
import { useStreamHasLiveVideo } from '../../providers/useStreamHasLiveVideo';

// Above this normalised audio level the speaking ring becomes visible. Keeps
// background noise / fan hum from constantly lighting the border.
const SPEAKING_THRESHOLD = 0.12;
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
	background-color: ${Palette.surface['surface-neutral'].toString()};
	border: 1px solid ${Palette.stroke['stroke-medium'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
	transition: box-shadow 80ms linear;
`;

const labelStyles = css`
	position: absolute;
	left: 8px;
	bottom: 6px;
	padding: 2px 8px;
	border-radius: 4px;
	background-color: rgba(0, 0, 0, 0.55);
	color: white;
	font-size: 12px;
	line-height: 16px;
	max-width: calc(100% - 16px);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
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
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background-color: rgba(0, 0, 0, 0.55);
	color: white;
`;

// When the participant has their hand raised, the tile background tints
// green so the queue is visible at a glance, while the name label keeps
// its original dark-pill styling unchanged.
const handRaisedLabelStyles = css`
	background-color: rgb(54 135 58 / 95%);
`;

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
};

const CallTile = ({
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

	const ringThickness = displayLevel * (compact ? 3 : 4);
	const ringGlow = displayLevel * (compact ? 6 : 12);
	const ringColor = Palette.stroke['stroke-highlight'].toString();
	const ringStyle =
		displayLevel > 0
			? {
					boxShadow: `0 0 0 ${ringThickness}px ${ringColor}, 0 0 ${ringGlow}px ${ringThickness / 2}px ${ringColor}`,
				}
			: undefined;

	return (
		<Box className={tileStyles} style={ringStyle}>
			{cameraActive ? (
				<video
					ref={videoRef as any}
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
				<Avatar url={avatarUrl} size={avatarSize} />
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
			{(muted || held) && (
				<Box className={indicatorRowStyles}>
					{muted && (
						<Box className={indicatorBadgeStyles}>
							<Icon name='mic-off' size='x16' />
						</Box>
					)}
					{held && (
						<Box className={indicatorBadgeStyles}>
							<Icon name='pause-shape-unfilled' size='x16' />
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default CallTile;
