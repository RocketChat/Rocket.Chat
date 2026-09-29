import type { RemoteParticipantInfo } from '../context';
import { TILE_GAP_PX } from './tileGrid';

/** The reader as the stage draws them. */
export type StageSelf = {
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

export type StageTile = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream | null;
	audioStream?: MediaStream | null;
	mirrored: boolean;
	muteVideoAudio: boolean;
	handPosition?: number;
	sendHeight?: number;
};

export type StageSize = { width: number; height: number };

export type SpotlightOrientation = 'stacked' | 'side-by-side';

/** The most tiles the grid shows; past it, the last slot says how many more there are. */
export const MAX_VISIBLE_TILES = 9;

/**
 * Wider than this and the screen fits better beside a column of thumbs than above a strip of them. Below 16:9 on
 * purpose: at 1.6 the strip would already eat too much of the screen's height.
 */
const SPOTLIGHT_SIDE_BY_SIDE_ASPECT = 1.5;

/** The thumb sizes the sidebar styles draw: a 200px-wide 16:9 column, or a 140px-wide strip. */
const COLUMN_THUMB_HEIGHT = 200 * (9 / 16);
const STRIP_THUMB_WIDTH = 140;
const STAGE_PADDING = 16;

/** Everyone's tile, the reader first. */
export const buildStageTiles = (
	self: StageSelf,
	remoteParticipants: RemoteParticipantInfo[],
	handPositions: Record<string, number> | undefined,
): StageTile[] => [
	{
		id: self.id,
		displayName: self.displayName,
		avatarUrl: self.avatarUrl,
		muted: self.muted,
		held: self.held,
		cameraStream: self.cameraStream,
		audioStream: self.audioStream,
		mirrored: true,
		muteVideoAudio: true,
		handPosition: handPositions?.[self.id],
		sendHeight: self.sendHeight,
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

/** Who gets the large view: whoever is speaking, else the first person who is not the reader. */
export const pickFeaturedTile = (tiles: StageTile[], activeSpeakerId: string | null, selfId: string): StageTile =>
	tiles.find((t) => t.id === activeSpeakerId) ?? tiles.find((t) => t.id !== selfId) ?? tiles[0];

/** How much a tile deserves one of the few visible slots: the speaker, then a camera, then the reader. */
export const tilePriority = (tile: StageTile, activeSpeakerId: string | null, selfId: string): number =>
	(tile.id === activeSpeakerId ? 1000 : 0) + (tile.cameraStream ? 100 : 0) + (tile.id === selfId ? 50 : 0);

/**
 * Splits tiles into what fits in `capacity` slots and what does not. When they do not all fit, one slot goes to the
 * overflow tile, and the highest-priority tiles take the rest, keeping their order.
 */
export const splitByPriority = (
	tiles: StageTile[],
	capacity: number,
	activeSpeakerId: string | null,
	selfId: string,
): { visible: StageTile[]; hidden: StageTile[] } => {
	if (tiles.length <= capacity) {
		return { visible: tiles, hidden: [] };
	}
	const slots = Math.max(0, capacity - 1);
	const ranked = tiles
		.map((tile, index) => ({ index, score: tilePriority(tile, activeSpeakerId, selfId) }))
		.sort((a, b) => b.score - a.score);
	const shown = new Set(ranked.slice(0, slots).map(({ index }) => index));
	return {
		visible: tiles.filter((_, i) => shown.has(i)),
		hidden: tiles.filter((_, i) => !shown.has(i)),
	};
};

/**
 * Keeps a single tile from sitting alone on the last row: when there is already an overflow tile, the last visible
 * tile joins it so the row fills up.
 */
export const absorbLonelyTile = (
	visible: StageTile[],
	hidden: StageTile[],
	cols: number,
): { visible: StageTile[]; hidden: StageTile[] } => {
	const count = visible.length + (hidden.length > 0 ? 1 : 0);
	if (cols > 1 && hidden.length > 0 && count % cols === 1) {
		return { visible: visible.slice(0, -1), hidden: [visible[visible.length - 1], ...hidden] };
	}
	return { visible, hidden };
};

/** The key of each grid cell in render order, the overflow tile last. */
export const gridCellKeys = (visible: StageTile[], hidden: StageTile[]): string[] => [
	...visible.map(({ id }) => id),
	...(hidden.length > 0 ? ['overflow'] : []),
];

/**
 * The column a cell starts at, when it sits on a last row that is not full: those are centred at their own width
 * rather than stretched across it.
 */
export const gridColumnStartFor = (index: number, count: number, cols: number): number | undefined => {
	const orphans = count % cols;
	const orphanStart = count - orphans;
	if (orphans === 0 || index < orphanStart) {
		return undefined;
	}
	return Math.floor((cols - orphans) / 2) + 1 + (index - orphanStart);
};

export const spotlightOrientation = ({ width, height }: StageSize): SpotlightOrientation =>
	height > 0 && width / height >= SPOTLIGHT_SIDE_BY_SIDE_ASPECT ? 'side-by-side' : 'stacked';

/** How many thumbs fit beside or under the large view without scrolling; unbounded until the stage is measured. */
export const sidebarCapacity = (size: StageSize, orientation: SpotlightOrientation): number => {
	if (size.width === 0 || size.height === 0) return Infinity;
	if (orientation === 'side-by-side') {
		return Math.max(1, Math.floor((size.height - STAGE_PADDING + TILE_GAP_PX) / (COLUMN_THUMB_HEIGHT + TILE_GAP_PX)));
	}
	return Math.max(1, Math.floor((size.width - STAGE_PADDING + TILE_GAP_PX) / (STRIP_THUMB_WIDTH + TILE_GAP_PX)));
};
