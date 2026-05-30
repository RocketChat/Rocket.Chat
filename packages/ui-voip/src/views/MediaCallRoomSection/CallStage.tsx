import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Palette } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { useMemo } from 'react';

import CallTile from './CallTile';
import type { RemoteParticipantInfo } from '../../context/MediaCallViewContext';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

type LocalParticipant = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream | null;
	screenStream?: MediaStream | null;
	audioStream?: MediaStream | null;
};

type CallStageProps = {
	localParticipant: LocalParticipant;
	remoteParticipants: RemoteParticipantInfo[];
	onStopLocalScreenShare?: () => void;
	/** Map from participantId → 1-based queue position for the raise-hand badge. */
	handPositions?: Record<string, number>;
	/** Map from participantId → list of active reactions to overlay on their tile. */
	reactionsByParticipant?: Record<string, { id: string; emoji: string }[]>;
};

const stageStyles = css`
	position: relative;
	display: flex;
	flex: 1 1 0;
	min-height: 0;
	padding: 8px;
	gap: 8px;
	overflow: hidden;
`;

const spotlightStyles = css`
	display: grid;
	grid-template-rows: minmax(0, 1fr) auto;
	gap: 8px;
	width: 100%;
	min-height: 0;
`;

// auto-fit grid: as many columns as fit at min ~180px, tiles share the row
// height equally. min-height:0 lets tiles shrink in flex parent.
const gridStyles = css`
	display: grid;
	width: 100%;
	min-height: 0;
	gap: 8px;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	grid-auto-rows: 1fr;
`;

// keep the screen video framed as 16:9 inside the bounding box
const mainStreamStyles = css`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${Palette.surface['surface-neutral'].toString()};
	border-radius: 6px;
	overflow: hidden;
	min-height: 0;
`;

const thumbStripStyles = css`
	display: flex;
	gap: 8px;
	height: 96px;
	overflow-x: auto;
	overflow-y: hidden;
	padding-block: 2px;
	scrollbar-width: thin;
`;

const thumbItemStyles = css`
	flex: 0 0 auto;
	width: 140px;
	height: 100%;
`;

const stopShareButtonStyles = css`
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 1;
`;

const ownBadgeStyles = css`
	position: absolute;
	left: 8px;
	bottom: 8px;
	padding: 2px 8px;
	border-radius: 4px;
	background-color: rgba(0, 0, 0, 0.55);
	color: white;
	font-size: 12px;
	line-height: 16px;
	pointer-events: none;
`;

type ScreenViewerProps = {
	stream: MediaStream;
	label: string;
	isLocal?: boolean;
	onStop?: () => void;
};

const ScreenViewer = ({ stream, label, isLocal, onStop }: ScreenViewerProps) => {
	const [videoRef] = usePlayMediaStream(stream);
	return (
		<Box className={mainStreamStyles}>
			<video
				ref={videoRef as unknown as Ref<HTMLVideoElement>}
				preload='metadata'
				muted={isLocal}
				style={{ width: '100%', height: '100%', objectFit: 'contain' }}
			>
				<track kind='captions' />
			</video>
			<Box className={ownBadgeStyles}>{label}</Box>
			{isLocal && onStop && (
				<Box className={stopShareButtonStyles}>
					<IconButton icon='cross' small secondary onClick={onStop} title='Stop sharing' />
				</Box>
			)}
		</Box>
	);
};

// eslint-disable-next-line react/no-multi-comp
const CallStage = ({
	localParticipant,
	remoteParticipants,
	onStopLocalScreenShare,
	handPositions,
	reactionsByParticipant,
}: CallStageProps) => {
	// Pick a single "featured" screen share. Priority: remote first (more
	// interesting to the local viewer), then local. Multi-remote-screen calls
	// are rare; the others just become participant tiles via cameraStream.
	const featuredScreen = useMemo<{ stream: MediaStream; label: string; isLocal: boolean } | null>(() => {
		const remoteWithScreen = remoteParticipants.find((p) => p.screenStream);
		if (remoteWithScreen?.screenStream) {
			return { stream: remoteWithScreen.screenStream, label: `${remoteWithScreen.displayName} — screen`, isLocal: false };
		}
		if (localParticipant.screenStream) {
			return { stream: localParticipant.screenStream, label: 'You — screen', isLocal: true };
		}
		return null;
	}, [remoteParticipants, localParticipant.screenStream]);

	const tiles = useMemo(() => {
		const all = [
			{
				id: localParticipant.id,
				displayName: localParticipant.displayName,
				avatarUrl: localParticipant.avatarUrl,
				muted: localParticipant.muted,
				held: localParticipant.held,
				cameraStream: localParticipant.cameraStream,
				audioStream: localParticipant.audioStream,
				mirrored: true,
				muteVideoAudio: true,
				handPosition: handPositions?.[localParticipant.id],
				reactions: reactionsByParticipant?.[localParticipant.id],
			},
			...remoteParticipants.map((p) => ({
				id: p.id,
				displayName: p.displayName,
				avatarUrl: p.avatarUrl,
				muted: p.muted,
				held: p.held,
				cameraStream: p.cameraStream,
				audioStream: p.audioStream,
				mirrored: false,
				muteVideoAudio: false,
				handPosition: handPositions?.[p.id],
				reactions: reactionsByParticipant?.[p.id],
			})),
		];
		return all;
	}, [localParticipant, remoteParticipants, handPositions, reactionsByParticipant]);

	if (featuredScreen) {
		return (
			<Box className={stageStyles}>
				<Box className={spotlightStyles}>
					<ScreenViewer
						stream={featuredScreen.stream}
						label={featuredScreen.label}
						isLocal={featuredScreen.isLocal}
						onStop={featuredScreen.isLocal ? onStopLocalScreenShare : undefined}
					/>
					<Box className={thumbStripStyles}>
						{tiles.map((t) => (
							<Box key={t.id} className={thumbItemStyles}>
								<CallTile {...t} compact />
							</Box>
						))}
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box className={stageStyles}>
			<Box className={gridStyles}>
				{tiles.map((t) => (
					<CallTile key={t.id} {...t} />
				))}
			</Box>
		</Box>
	);
};

export default CallStage;
