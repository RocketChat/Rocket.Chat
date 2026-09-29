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

/** What a tile shows of anyone in the call. */
export type TileParticipant = {
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream | null;
	/** Drives the speaking indicator. */
	audioStream?: MediaStream | null;
};

/** The reader's tile says what it sends; nobody else's can. */
export type StageTile = TileParticipant & { id: string } & ({ kind: 'self'; sendHeight?: number } | { kind: 'participant' });

export type StageSize = { width: number; height: number };

export type SpotlightOrientation = 'stacked' | 'side-by-side';

/** The most tiles the grid shows; past it, the last slot says how many more there are. */
export const MAX_VISIBLE_TILES = 9;

/**
 * Wider than this and the screen fits better beside a column of thumbs than above a strip of them. Below 16:9 on
 * purpose: at 1.6 the strip would already eat too much of the screen's height.
 */
const SPOTLIGHT_SIDE_BY_SIDE_ASPECT = 1.5;

/** The thumb sizes the sidebar draws, in pixels: a column of 16:9 thumbs, or a strip of fixed-width ones. */
export const COLUMN_THUMB_WIDTH = 200;
export const STRIP_THUMB_WIDTH = 140;
const COLUMN_THUMB_HEIGHT = COLUMN_THUMB_WIDTH * (9 / 16);
/** The stage's padding across its width; it has none along its height. */
const STAGE_PADDING = 16;

/** Everyone's tile, the reader first. */
export const buildStageTiles = (self: StageSelf, remoteParticipants: RemoteParticipantInfo[]): StageTile[] => [
	{
		id: self.id,
		displayName: self.displayName,
		avatarUrl: self.avatarUrl,
		muted: self.muted,
		held: self.held,
		cameraStream: self.cameraStream,
		audioStream: self.audioStream,
		kind: 'self',
		sendHeight: self.sendHeight,
	},
	...remoteParticipants.map((p): StageTile => ({
		kind: 'participant',
		id: p.id,
		displayName: p.displayName,
		avatarUrl: p.avatarUrl,
		muted: p.muted,
		held: p.held,
		cameraStream: p.cameraStream,
		audioStream: p.audioStream,
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
 * Keeps a single tile from sitting alone on the last row: when there is already an overflow tile, the visible tile
 * that least deserves its slot — the last of them, among equals — joins it so the row fills up.
 */
export const absorbLonelyTile = (
	visible: StageTile[],
	hidden: StageTile[],
	cols: number,
	activeSpeakerId: string | null,
	selfId: string,
): { visible: StageTile[]; hidden: StageTile[] } => {
	const count = visible.length + (hidden.length > 0 ? 1 : 0);
	if (cols > 1 && visible.length > 0 && hidden.length > 0 && count % cols === 1) {
		const priority = (tile: StageTile) => tilePriority(tile, activeSpeakerId, selfId);
		const absorbed = visible.reduce((lowest, tile) => (priority(tile) <= priority(lowest) ? tile : lowest));
		return { visible: visible.filter((tile) => tile !== absorbed), hidden: [absorbed, ...hidden] };
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
		return Math.max(1, Math.floor((size.height + TILE_GAP_PX) / (COLUMN_THUMB_HEIGHT + TILE_GAP_PX)));
	}
	return Math.max(1, Math.floor((size.width - STAGE_PADDING + TILE_GAP_PX) / (STRIP_THUMB_WIDTH + TILE_GAP_PX)));
};
