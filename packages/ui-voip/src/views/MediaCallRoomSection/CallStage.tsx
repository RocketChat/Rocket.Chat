import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon, IconButton, Palette } from '@rocket.chat/fuselage';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import CallTile from './CallTile';
import type { RemoteParticipantInfo } from '../../context/MediaCallViewContext';
import { useActiveSpeakerId } from '../../providers/useActiveSpeakerId';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';
import { useTileGridLayout } from '../../providers/useTileGridLayout';

type LocalParticipant = {
	id: string;
	displayName: string;
	/** How tall the picture actually going out is, for the reader's own tile to say so. */
	sendHeight?: number;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream | null;
	screenStream?: MediaStream | null;
	audioStream?: MediaStream | null;
};

export type StageLayout = 'grid' | 'spotlight' | 'sidebar';

type CallStageProps = {
	localParticipant: LocalParticipant;
	remoteParticipants: RemoteParticipantInfo[];
	onStopLocalScreenShare?: () => void;
	/** Map from participantId → 1-based queue position for the raise-hand badge. */
	handPositions?: Record<string, number>;
	/** Which layout to use when no screen share is active. Defaults to `'grid'`. */
	layout?: StageLayout;
};

const stageStyles = css`
	position: relative;
	display: flex;
	flex: 1 1 0;
	min-height: 0;
	padding-block: 0;
	padding-inline: 8px;
	gap: 8px;
	overflow: hidden;
`;

// Two flavours: stacked (screen on top, thumbs in a row at the bottom) and
// side-by-side (screen on left, thumbs in a column on the right). The
// orientation choice (below) picks whichever maximises the rendered screen
// area inside the available stage. Both use flex so the thumb strip's
// orientation is a single direction flip.
const spotlightStackedStyles = css`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
`;

const spotlightSideBySideStyles = css`
	display: flex;
	flex-direction: row;
	gap: 8px;
	width: 100%;
	height: 100%;
	min-width: 0;
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

// Screen viewer's bounding box. Needs to grow into all the space the spotlight
// container leaves it after the thumb strip / column takes its fixed slot —
// hence `flex: 1 1 0` and zero mins so flexbox actually shrinks it when the
// stage is short or narrow. Without flex-grow the box sized to its intrinsic
// content (or zero in some browsers) and the screen ended up letterboxed
// inside a too-small viewer, leaving large empty stage area beside it.
const mainStreamStyles = css`
	position: relative;
	display: flex;
	flex: 1 1 0;
	min-width: 0;
	min-height: 0;
	align-items: center;
	justify-content: center;
	background-color: ${Palette.surface['surface-neutral'].toString()};
	border-radius: 6px;
	overflow: hidden;
`;

const thumbStripStyles = css`
	display: flex;
	gap: 8px;
	height: 96px;
	flex-shrink: 0;
	overflow-x: auto;
	overflow-y: hidden;
	padding-block: 2px;
	scrollbar-width: thin;
`;

// Side-by-side variant: column of thumbs, fixed width on the right.
const thumbColumnStyles = css`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 200px;
	height: 100%;
	flex-shrink: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding-inline: 2px;
	scrollbar-width: thin;
`;

const thumbItemStyles = css`
	flex: 0 0 auto;
	width: 140px;
	height: 100%;
`;

// When laid out as a column, each thumb takes the full column width and
// constrains its height via aspect-ratio so the avatar/camera stays in a
// reasonable proportion regardless of how tall the column is.
const thumbItemColumnStyles = css`
	flex: 0 0 auto;
	width: 100%;
	aspect-ratio: 16 / 9;
`;

// A screen-share tile in the thumb strip — wider than participant thumbs so
// the actual screen content is legible. On hover a "spotlight" overlay
// reveals a button to promote the tile to the principal screen position.
// In side-by-side spotlight, the parent column forces width=100% and the
// aspect-ratio rule below pins the height; in stacked mode the parent row
// uses the explicit width/height defaults below.
const screenThumbStyles = css`
	position: relative;
	flex: 0 0 auto;
	width: 200px;
	height: 100%;
	border-radius: 6px;
	overflow: hidden;
	background-color: black;
	border: 1px solid ${Palette.stroke['stroke-medium'].toString()};

	[data-thumb-orientation='column'] & {
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
	}

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

// Spotlight layout: active speaker fills the stage, local user floats in the corner.
const spotlightSelfPipStyles = css`
	position: absolute;
	bottom: 16px;
	right: 16px;
	width: 180px;
	aspect-ratio: 16 / 9;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	z-index: 2;
`;

const overflowTileStyles = css`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100%;
	border-radius: 6px;
	background-color: ${Palette.surface['surface-neutral'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
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
			<video ref={videoRef} preload='metadata' muted={isLocal} style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
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
				ref={videoRef}
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
const OverflowTile = ({ hidden }: { hidden: { avatarUrl?: string; displayName: string }[] }) => (
	<Box className={overflowTileStyles}>
		<Box display='flex' justifyContent='center' alignItems='center' flexDirection='row' gap={4}>
			{hidden.slice(0, 2).map((p, i) =>
				p.avatarUrl ? (
					<Avatar key={i} url={p.avatarUrl} size='x36' />
				) : (
					<Box
						key={i}
						display='flex'
						alignItems='center'
						justifyContent='center'
						style={{
							width: 36,
							height: 36,
							borderRadius: '50%',
							backgroundColor: Palette.surface['surface-hover'].toString(),
							flexShrink: 0,
						}}
					>
						<Icon name='user' size='x20' />
					</Box>
				),
			)}
		</Box>
		{hidden.length > 2 && (
			<Box fontSize={13} fontWeight={600} lineHeight={1} marginBlockStart={2} color='font-secondary-info'>
				{hidden.length} others
			</Box>
		)}
	</Box>
);

const MAX_VISIBLE_TILES = 9;

// eslint-disable-next-line react/no-multi-comp
const CallStage = ({ localParticipant, remoteParticipants, onStopLocalScreenShare, handPositions, layout = 'grid' }: CallStageProps) => {
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
			if (existing?.stream !== stream) {
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
				sendHeight: localParticipant.sendHeight,
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
			})),
		];
		return all;
	}, [localParticipant, remoteParticipants, handPositions]);

	// Dev: inject simulated tiles for testing pagination.
	// In the browser console: localStorage.setItem('videoconf-simulate-tiles', '20')
	// then rejoin the call. Set to '0' or remove the key to disable.
	const [simulateCount] = useState(() => {
		try {
			return parseInt(localStorage.getItem('videoconf-simulate-tiles') ?? '', 10) || 0;
		} catch {
			return 0;
		}
	});

	const allTiles = useMemo(() => {
		if (simulateCount <= 0) return tiles;
		const fakeNames = [
			'Alice Johnson',
			'Bob Smith',
			'Carol Williams',
			'David Brown',
			'Eve Davis',
			'Frank Miller',
			'Grace Wilson',
			'Henry Moore',
			'Iris Taylor',
			'Jack Anderson',
			'Karen Thomas',
			'Leo Jackson',
			'Mia White',
			'Noah Harris',
			'Olivia Martin',
			'Paul Garcia',
			'Quinn Martinez',
			'Ruby Robinson',
			'Sam Clark',
			'Tina Lewis',
		];
		return [
			...tiles,
			...Array.from({ length: simulateCount }, (_, i) => {
				const name = fakeNames[i % fakeNames.length];
				return {
					id: `sim-${i}`,
					displayName: name,
					avatarUrl: `/avatar/@${encodeURIComponent(name)}`,
					muted: i % 3 === 0,
					held: false,
					cameraStream: undefined as MediaStream | null | undefined,
					audioStream: undefined as MediaStream | null | undefined,
					mirrored: false,
					muteVideoAudio: false,
					handPosition: undefined as number | undefined,
					sendHeight: undefined as number | undefined,
				};
			}),
		];
	}, [tiles, simulateCount]);

	// Active speaker: used by spotlight and sidebar layouts to decide which
	// participant gets the large view. Falls back to the first remote
	// participant when nobody is speaking.
	const audioParticipants = useMemo(() => remoteParticipants.map((p) => ({ id: p.id, audioStream: p.audioStream })), [remoteParticipants]);
	const activeSpeakerId = useActiveSpeakerId(audioParticipants, remoteParticipants[0]?.id ?? localParticipant.id);

	// Grid pagination: show at most MAX_VISIBLE_TILES tiles. When there are
	// more, the last slot becomes a "+N" overflow placeholder. Tiles with
	// camera enabled and the current active speaker are prioritised for the
	// visible set; the local participant always stays visible.
	const { visibleTiles, hiddenTiles } = useMemo(() => {
		if (allTiles.length <= MAX_VISIBLE_TILES) {
			return { visibleTiles: allTiles, hiddenTiles: [] as typeof allTiles };
		}
		const maxVisible = MAX_VISIBLE_TILES - 1;
		const scored = allTiles.map((tile, originalIndex) => {
			let score = 0;
			if (tile.id === activeSpeakerId) score += 1000;
			if (tile.cameraStream) score += 100;
			if (tile.id === localParticipant.id) score += 50;
			return { originalIndex, score };
		});
		const sorted = [...scored].sort((a, b) => b.score - a.score);
		const visibleIndices = new Set(sorted.slice(0, maxVisible).map((s) => s.originalIndex));
		const visible = allTiles.filter((_, i) => visibleIndices.has(i));
		const hidden = allTiles.filter((_, i) => !visibleIndices.has(i));
		return { visibleTiles: visible, hiddenTiles: hidden };
	}, [allTiles, activeSpeakerId, localParticipant.id]);

	const gridTileCount = visibleTiles.length + (hiddenTiles.length > 0 ? 1 : 0);

	// IMPORTANT: hooks must run unconditionally on every render. Both the
	// grid layout hook and its companion ref live above any conditional
	// return — when a screen share starts mid-call featuredScreen flips
	// non-null and the component takes the spotlight branch; if the
	// layout hooks were below that branch they'd skip a render and
	// trigger "Rendered fewer hooks than expected".
	const [measureEl, setMeasureEl] = useState<HTMLDivElement | null>(null);
	const measureRef = useCallback((node: HTMLDivElement | null) => setMeasureEl(node), []);
	const { rows, cols, cellWidth, cellHeight } = useTileGridLayout(measureEl, gridTileCount);

	// Spotlight orientation: when the stage is wider than ~16:9 the screen
	// fits better against a vertical thumb column on the right; otherwise
	// keep the screen on top with thumbs along the bottom.
	//
	// IMPORTANT: the stage element only mounts on the spotlight branch
	// (i.e. once `featuredScreen` becomes non-null). A plain `useRef` +
	// `useEffect([], ...)` setup observed the ref at mount-time, when it
	// was still null, and never re-ran. Using a callback ref re-runs the
	// effect whenever the underlying element appears or detaches.
	const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
	const stageRefCallback = useCallback((node: HTMLDivElement | null) => {
		setStageEl(node);
	}, []);
	const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
	useEffect(() => {
		if (!stageEl) return undefined;
		const update = () => {
			const rect = stageEl.getBoundingClientRect();
			setStageSize({ width: rect.width, height: rect.height });
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(stageEl);
		return () => ro.disconnect();
	}, [stageEl]);
	// Lowered the threshold from a strict 16:9 (1.78) to ~1.5 so typical
	// "wider than tall" stages flip to side-by-side. The exact 16:9 cutoff
	// matches the screen content aspect, but in practice a stage at 1.6
	// already benefits from the side column because the bottom strip
	// would otherwise eat too much of the screen's vertical room.
	const SPOTLIGHT_SIDE_BY_SIDE_ASPECT = 1.5;
	const spotlightOrientation: 'stacked' | 'side-by-side' =
		stageSize.height > 0 && stageSize.width / stageSize.height >= SPOTLIGHT_SIDE_BY_SIDE_ASPECT ? 'side-by-side' : 'stacked';

	// Sidebar pagination: how many thumb tiles fit without scrolling.
	// Column: each thumb is width=200, aspect-ratio 16:9 → ~112px tall.
	// Row: each thumb is 140px wide, strip is 96px tall.
	const sidebarCapacity = useMemo(() => {
		if (stageSize.width === 0 || stageSize.height === 0) return Infinity;
		const gap = TILE_GAP_PX;
		if (spotlightOrientation === 'side-by-side') {
			const thumbH = 200 * (9 / 16);
			return Math.max(1, Math.floor((stageSize.height - 16 + gap) / (thumbH + gap)));
		}
		return Math.max(1, Math.floor((stageSize.width - 16 + gap) / (140 + gap)));
	}, [stageSize, spotlightOrientation]);

	const sidebarOthers = useMemo(() => {
		const featured = allTiles.find((t) => t.id === activeSpeakerId) ?? allTiles.find((t) => t.id !== localParticipant.id) ?? allTiles[0];
		const others = allTiles.filter((t) => t.id !== featured?.id);
		if (others.length <= sidebarCapacity) {
			return { visible: others, hidden: [] as typeof others };
		}
		const maxVisible = Math.max(0, sidebarCapacity - 1);
		const scored = others.map((tile, idx) => {
			let score = 0;
			if (tile.cameraStream) score += 100;
			if (tile.id === localParticipant.id) score += 50;
			return { idx, score };
		});
		scored.sort((a, b) => b.score - a.score);
		const visibleSet = new Set(scored.slice(0, maxVisible).map((s) => s.idx));
		const visible = others.filter((_, i) => visibleSet.has(i));
		const hidden = others.filter((_, i) => !visibleSet.has(i));
		return { visible, hidden };
	}, [allTiles, activeSpeakerId, localParticipant.id, sidebarCapacity]);

	// FLIP animation: when the grid structure changes (cols/rows), tiles
	// animate from their old position to the new one instead of snapping.
	const gridRef = useRef<HTMLDivElement | null>(null);
	const prevRectsRef = useRef(new Map<string, DOMRect>());
	const prevColsRef = useRef(cols);

	const tileKeys = useMemo(() => {
		// Must match what the grid actually renders (effectiveVisible/effectiveHidden),
		// but hooks run unconditionally before the effective split is computed.
		// Since the split only ever removes the last visible tile when
		// gridTileCount % cols === 1, pre-compute the same check here.
		const total = visibleTiles.length + (hiddenTiles.length > 0 ? 1 : 0);
		const willTrim = cols > 1 && hiddenTiles.length > 0 && total % cols === 1;
		const vis = willTrim ? visibleTiles.slice(0, -1) : visibleTiles;
		const hasHidden = willTrim || hiddenTiles.length > 0;
		const keys = vis.map((t) => t.id);
		if (hasHidden) keys.push('overflow');
		return keys;
	}, [visibleTiles, hiddenTiles.length, cols]);

	useLayoutEffect(() => {
		const grid = gridRef.current;
		if (!grid) return;

		const children = Array.from(grid.children) as HTMLElement[];
		const structureChanged = prevColsRef.current !== cols;
		prevColsRef.current = cols;

		if (structureChanged && prevRectsRef.current.size > 0) {
			children.forEach((child, i) => {
				const key = tileKeys[i];
				if (!key) return;
				const prevRect = prevRectsRef.current.get(key);
				const currRect = child.getBoundingClientRect();
				if (!prevRect) return;

				const dx = prevRect.left - currRect.left;
				const dy = prevRect.top - currRect.top;

				if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
					child.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
						duration: 300,
						easing: 'cubic-bezier(0.2, 0, 0, 1)',
					});
				}
			});
		}

		const next = new Map<string, DOMRect>();
		children.forEach((child, i) => {
			const key = tileKeys[i];
			if (key) next.set(key, child.getBoundingClientRect());
		});
		prevRectsRef.current = next;
	});

	if (featuredScreen) {
		const isSideBySide = spotlightOrientation === 'side-by-side';
		return (
			<Box className={stageStyles} ref={stageRefCallback}>
				<Box className={isSideBySide ? spotlightSideBySideStyles : spotlightStackedStyles}>
					<ScreenViewer
						stream={featuredScreen.stream}
						label={featuredScreen.label}
						isLocal={featuredScreen.isLocal}
						onStop={featuredScreen.isLocal ? onStopLocalScreenShare : undefined}
					/>
					<Box className={isSideBySide ? thumbColumnStyles : thumbStripStyles} data-thumb-orientation={isSideBySide ? 'column' : 'row'}>
						{otherScreenShares.map((s) => (
							<ScreenShareThumb
								key={`screen-${s.id}`}
								stream={s.stream}
								label={s.label}
								isLocal={s.isLocal}
								onSpotlight={() => setPinnedScreenId(s.id)}
							/>
						))}
						{allTiles.map((t) => (
							<Box key={t.id} className={isSideBySide ? thumbItemColumnStyles : thumbItemStyles}>
								<CallTile {...t} compact />
							</Box>
						))}
					</Box>
				</Box>
			</Box>
		);
	}

	// Spotlight layout: active speaker fills the stage, local user's self-view
	// floats as a small PiP in the bottom-right corner.
	if (layout === 'spotlight') {
		const featured = allTiles.find((t) => t.id === activeSpeakerId) ?? allTiles.find((t) => t.id !== localParticipant.id) ?? allTiles[0];
		const selfTile = allTiles.find((t) => t.id === localParticipant.id);
		const mainTile = featured;
		return (
			<Box className={stageStyles}>
				<Box display='flex' width='full' height='full' position='relative'>
					<Box className={mainStreamStyles}>
						<CallTile {...mainTile} />
					</Box>
					{selfTile && selfTile.id !== mainTile.id && (
						<Box className={spotlightSelfPipStyles}>
							<CallTile {...selfTile} compact />
						</Box>
					)}
				</Box>
			</Box>
		);
	}

	// Sidebar layout: active speaker large on the left, everyone else in a
	// thumb column on the right — the same structure as the screen-share
	// spotlight, but with a camera feed instead of a screen.
	if (layout === 'sidebar') {
		const isSideBySide = spotlightOrientation === 'side-by-side';
		const featured = allTiles.find((t) => t.id === activeSpeakerId) ?? allTiles.find((t) => t.id !== localParticipant.id) ?? allTiles[0];
		const { visible: sidebarVisible, hidden: sidebarHidden } = sidebarOthers;
		return (
			<Box className={stageStyles} ref={stageRefCallback}>
				<Box className={isSideBySide ? spotlightSideBySideStyles : spotlightStackedStyles}>
					<Box className={mainStreamStyles}>
						<CallTile {...featured} />
					</Box>
					{(sidebarVisible.length > 0 || sidebarHidden.length > 0) && (
						<Box
							className={isSideBySide ? thumbColumnStyles : thumbStripStyles}
							style={{ overflow: 'hidden' }}
							data-thumb-orientation={isSideBySide ? 'column' : 'row'}
						>
							{sidebarVisible.map((t) => (
								<Box key={t.id} className={isSideBySide ? thumbItemColumnStyles : thumbItemStyles}>
									<CallTile {...t} compact />
								</Box>
							))}
							{sidebarHidden.length > 0 && (
								<Box className={isSideBySide ? thumbItemColumnStyles : thumbItemStyles}>
									<OverflowTile hidden={sidebarHidden} />
								</Box>
							)}
						</Box>
					)}
				</Box>
			</Box>
		);
	}

	// Grid layout (default): all participants in equal-sized tiles.

	// Avoid a single lonely tile in the last row: when exactly one tile
	// would sit alone, move the last visible tile into the overflow so the
	// row fills up. Only when there is already an overflow — otherwise all
	// tiles fit and there is nothing to absorb into.
	let effectiveVisible = visibleTiles;
	let effectiveHidden = hiddenTiles;
	const effectiveTileCount = effectiveVisible.length + (effectiveHidden.length > 0 ? 1 : 0);
	if (cols > 1 && effectiveHidden.length > 0 && effectiveTileCount % cols === 1) {
		effectiveVisible = visibleTiles.slice(0, -1);
		effectiveHidden = [visibleTiles[visibleTiles.length - 1], ...hiddenTiles];
	}
	const effectiveGridCount = effectiveVisible.length + (effectiveHidden.length > 0 ? 1 : 0);

	// When the last row has fewer tiles than `cols`, we center the orphans at
	// their natural single-column width using `gridColumnStart` — never spanning.
	const lastRowOrphans = effectiveGridCount % cols;
	const orphanStart = effectiveGridCount - lastRowOrphans;
	const firstOrphanCol = lastRowOrphans > 0 ? Math.floor((cols - lastRowOrphans) / 2) + 1 : 1;

	const gridWidth = cols > 0 && cellWidth > 0 ? cols * cellWidth + (cols - 1) * TILE_GAP_PX : undefined;
	const gridHeight = rows > 0 && cellHeight > 0 ? rows * cellHeight + (rows - 1) * TILE_GAP_PX : undefined;

	return (
		<Box className={stageStyles}>
			<Box ref={measureRef} className={gridMeasureStyles}>
				<Box
					ref={gridRef}
					className={gridStyles}
					style={{
						width: gridWidth,
						height: gridHeight,
						gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
						gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
					}}
				>
					{effectiveVisible.map((t, i) => {
						const orphanIndex = lastRowOrphans > 0 && i >= orphanStart ? i - orphanStart : -1;
						const placement: { gridColumnStart?: number } = orphanIndex >= 0 ? { gridColumnStart: firstOrphanCol + orphanIndex } : {};
						return (
							<Box key={t.id} style={placement} minWidth={0} minHeight={0}>
								<CallTile {...t} />
							</Box>
						);
					})}
					{effectiveHidden.length > 0 && (
						<Box
							key='overflow'
							style={
								lastRowOrphans > 0 && effectiveVisible.length >= orphanStart
									? { gridColumnStart: firstOrphanCol + (effectiveVisible.length - orphanStart) }
									: undefined
							}
							minWidth={0}
							minHeight={0}
						>
							<OverflowTile hidden={effectiveHidden} />
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default CallStage;
