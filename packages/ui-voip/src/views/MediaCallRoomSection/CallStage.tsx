import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Palette } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

// A screen-share tile in the thumb strip — wider than participant thumbs so
// the actual screen content is legible. On hover a "spotlight" overlay
// reveals a button to promote the tile to the principal screen position.
const screenThumbStyles = css`
	position: relative;
	flex: 0 0 auto;
	width: 200px;
	height: 100%;
	border-radius: 6px;
	overflow: hidden;
	background-color: black;
	border: 1px solid ${Palette.stroke['stroke-medium'].toString()};

	& .rcx-screen-thumb-overlay {
		opacity: 0;
		pointer-events: none;
		transition: opacity 150ms ease;
	}
	&:hover .rcx-screen-thumb-overlay {
		opacity: 1;
		pointer-events: auto;
	}
	&:focus-within .rcx-screen-thumb-overlay {
		opacity: 1;
		pointer-events: auto;
	}
`;

const spotlightOverlayStyles = css`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.45);
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

// Compact screen-share preview shown in the thumb strip when more than one
// participant is sharing. Renders the live screen video at a small size with
// a hover-revealed "spotlight" button — clicking it promotes this share to
// the principal (big) position.
// eslint-disable-next-line react/no-multi-comp
const ScreenShareThumb = ({
	stream,
	label,
	isLocal,
	onSpotlight,
}: {
	stream: MediaStream;
	label: string;
	isLocal: boolean;
	onSpotlight: () => void;
}) => {
	const [videoRef] = usePlayMediaStream(stream);
	return (
		<Box className={screenThumbStyles}>
			<video
				ref={videoRef as unknown as Ref<HTMLVideoElement>}
				preload='metadata'
				muted={isLocal}
				style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'black' }}
			>
				<track kind='captions' />
			</video>
			<Box className={ownBadgeStyles}>{label}</Box>
			<Box className={['rcx-screen-thumb-overlay', spotlightOverlayStyles]}>
				<IconButton icon='arrow-expand' small primary onClick={onSpotlight} title='Spotlight this screen' />
			</Box>
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
	// All currently-active screen shares (local + remote), in a stable shape
	// the rest of the component consumes. Re-derived each render from the
	// participants list; tracking of "when did each share start" lives in a
	// ref below so we can detect new arrivals.
	const currentScreenShares = useMemo<{ id: string; stream: MediaStream; label: string; isLocal: boolean }[]>(() => {
		const shares: { id: string; stream: MediaStream; label: string; isLocal: boolean }[] = [];
		if (localParticipant.screenStream) {
			shares.push({ id: localParticipant.id, stream: localParticipant.screenStream, label: 'You — screen', isLocal: true });
		}
		remoteParticipants.forEach((p) => {
			if (p.screenStream) shares.push({ id: p.id, stream: p.screenStream, label: `${p.displayName} — screen`, isLocal: false });
		});
		return shares;
	}, [localParticipant.id, localParticipant.screenStream, remoteParticipants]);

	// Map participantId → { stream, startedAt }. Updated by the effect below.
	// We compare against `stream` identity (not just presence) so that a
	// user who stops sharing and restarts is treated as a fresh share —
	// the new stream object means a new startedAt and an auto-promote.
	const screenShareInfoRef = useRef<Map<string, { stream: MediaStream; startedAt: number }>>(new Map());
	const [pinnedScreenId, setPinnedScreenId] = useState<string | null>(null);

	// Sync the start-time map and auto-promote brand-new shares to pinned.
	// Convention: when someone starts sharing, their share immediately
	// becomes the principal — overriding any prior pinned selection. If
	// the pinned share stops, fall back to "no pin" and the featured
	// selector picks the most recent of the survivors.
	useEffect(() => {
		const currentMap = new Map(currentScreenShares.map((s) => [s.id, s.stream] as const));
		let newlyAdded: string | null = null;
		currentMap.forEach((stream, id) => {
			const existing = screenShareInfoRef.current.get(id);
			if (!existing || existing.stream !== stream) {
				screenShareInfoRef.current.set(id, { stream, startedAt: Date.now() });
				newlyAdded = id;
			}
		});
		Array.from(screenShareInfoRef.current.keys()).forEach((id) => {
			if (!currentMap.has(id)) screenShareInfoRef.current.delete(id);
		});
		setPinnedScreenId((prev) => {
			if (newlyAdded !== null) return newlyAdded;
			if (prev && !currentMap.has(prev)) return null;
			return prev;
		});
	}, [currentScreenShares]);

	// Choose the principal screen: explicit pin (if still active), else
	// most recently started. Lookups go through the ref so we don't need
	// to re-derive on every map mutation.
	const featuredScreen = useMemo(() => {
		if (currentScreenShares.length === 0) return null;
		if (pinnedScreenId) {
			const pinned = currentScreenShares.find((s) => s.id === pinnedScreenId);
			if (pinned) return pinned;
		}
		return [...currentScreenShares].sort((a, b) => {
			const ta = screenShareInfoRef.current.get(a.id)?.startedAt ?? 0;
			const tb = screenShareInfoRef.current.get(b.id)?.startedAt ?? 0;
			return tb - ta;
		})[0];
	}, [currentScreenShares, pinnedScreenId]);

	const otherScreenShares = useMemo(
		() => (featuredScreen ? currentScreenShares.filter((s) => s.id !== featuredScreen.id) : []),
		[currentScreenShares, featuredScreen],
	);

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
						{otherScreenShares.map((s) => (
							<ScreenShareThumb
								key={`screen-${s.id}`}
								stream={s.stream}
								label={s.label}
								isLocal={s.isLocal}
								onSpotlight={() => setPinnedScreenId(s.id)}
							/>
						))}
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
