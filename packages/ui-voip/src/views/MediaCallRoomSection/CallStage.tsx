import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Palette } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { useMemo, useRef } from 'react';

import CallTile from './CallTile';
import type { RemoteParticipantInfo } from '../../context/MediaCallViewContext';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';
import { useTileGridLayout } from '../../providers/useTileGridLayout';

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
	/** Map from participantId → latest caption to overlay on their tile. */
	captionsByParticipant?: Record<string, { text: string; isFinal: boolean; updatedAt: number }>;
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

// Wrapper that fills the available stage area. Its size feeds the
// ResizeObserver in useTileGridLayout — kept full-size regardless of how
// large the inner grid actually ends up, so observed dimensions never
// shrink in response to the grid shrinking (no oscillation).
const gridMeasureStyles = css`
	flex: 1 1 0;
	min-width: 0;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
`;

// Grid container — explicit cell pixel sizes come from useTileGridLayout
// based on the wrapper's size + participant count, clamped to the [3:4 ..
// 16:9] aspect band. When the natural cell aspect would exceed the band
// the grid is smaller than the wrapper and centers within it; otherwise
// it fills the wrapper exactly.
const gridStyles = css`
	display: grid;
	gap: 8px;
`;

const TILE_GAP_PX = 8;

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
	captionsByParticipant,
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
				caption: captionsByParticipant?.[localParticipant.id],
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
				caption: captionsByParticipant?.[p.id],
			})),
		];
		return all;
	}, [localParticipant, remoteParticipants, handPositions, reactionsByParticipant, captionsByParticipant]);

	// IMPORTANT: hooks must run unconditionally on every render. Both the
	// grid layout hook and its companion ref live above any conditional
	// return — when a screen share starts mid-call featuredScreen flips
	// non-null and the component takes the spotlight branch; if the
	// layout hooks were below that branch they'd skip a render and
	// trigger "Rendered fewer hooks than expected".
	const measureRef = useRef<HTMLDivElement>(null);
	const { rows, cols, cellWidth, cellHeight } = useTileGridLayout(measureRef, tiles.length);

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

	// When the last row has fewer tiles than `cols`, we center the orphans at
	// their natural single-column width using `gridColumnStart` — never spanning.
	// An earlier version expanded each orphan to fill remaining columns, which
	// produced ultra-wide tiles (a single trailing tile would stretch 8:1
	// against the rest of the grid). Empty cells are visually inert: they're
	// the same dark surface as the grid background, so centered tiles read as
	// "fewer in this row" rather than "broken layout".
	const lastRowOrphans = tiles.length % cols;
	const orphanStart = tiles.length - lastRowOrphans;
	const firstOrphanCol = lastRowOrphans > 0 ? Math.floor((cols - lastRowOrphans) / 2) + 1 : 1;

	// Pre-compute the grid box total size from the clamped cell dims, so the
	// grid is exactly cell*N + gap*(N-1) wide/tall. Avoids subpixel rounding
	// causing a faint border peeking outside the box.
	const gridWidth = cols > 0 && cellWidth > 0 ? cols * cellWidth + (cols - 1) * TILE_GAP_PX : undefined;
	const gridHeight = rows > 0 && cellHeight > 0 ? rows * cellHeight + (rows - 1) * TILE_GAP_PX : undefined;

	return (
		<Box className={stageStyles}>
			<Box ref={measureRef} className={gridMeasureStyles}>
				<Box
					className={gridStyles}
					style={{
						width: gridWidth,
						height: gridHeight,
						gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
						gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
					}}
				>
					{tiles.map((t, i) => {
						const orphanIndex = lastRowOrphans > 0 && i >= orphanStart ? i - orphanStart : -1;
						const placement: { gridColumnStart?: number } = orphanIndex >= 0 ? { gridColumnStart: firstOrphanCol + orphanIndex } : {};
						return (
							<Box key={t.id} style={placement} minWidth={0} minHeight={0}>
								<CallTile {...t} />
							</Box>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

export default CallStage;
