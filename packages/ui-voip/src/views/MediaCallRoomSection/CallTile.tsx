/* eslint-disable no-nested-ternary */
import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon, Palette } from '@rocket.chat/fuselage';

import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

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

type CallTileProps = {
	displayName: string;
	avatarUrl?: string;
	muted?: boolean;
	held?: boolean;
	cameraStream?: MediaStream | null;
	/** Renders the camera flipped (use for the local participant). */
	mirrored?: boolean;
	/** When true, the embedded video element is muted (use for local self-view). */
	muteVideoAudio?: boolean;
	/** Smaller avatar; used in the spotlight thumbnail rail. */
	compact?: boolean;
};

const CallTile = ({ displayName, avatarUrl, muted, held, cameraStream, mirrored, muteVideoAudio, compact }: CallTileProps) => {
	const [videoRef] = usePlayMediaStream(cameraStream ?? null);
	const cameraActive = Boolean(cameraStream);
	const avatarSize = compact ? 'x32' : 'x48';

	return (
		<Box className={tileStyles}>
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
			<Box className={labelStyles}>{displayName}</Box>
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
