import type { RemoteParticipantInfo } from '../context';

/** The reader as the stage draws them. */
export type StageSelf = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream | null;
	screenStream?: MediaStream | null;
};

/** What a tile shows of anyone in the call. */
export type TileParticipant = {
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream | null;
};

/** The reader's tile is drawn as a mirror; everyone else's is not. */
export type StageTile = TileParticipant & { id: string; kind: 'self' | 'participant' };

/** The most tiles the grid shows; past it, the last slot says how many more there are. */
export const MAX_VISIBLE_TILES = 9;

/** Everyone's tile, the reader first. */
export const buildStageTiles = (self: StageSelf, remoteParticipants: RemoteParticipantInfo[]): StageTile[] => [
	{
		id: self.id,
		displayName: self.displayName,
		avatarUrl: self.avatarUrl,
		muted: self.muted,
		held: self.held,
		cameraStream: self.cameraStream,
		kind: 'self',
	},
	...remoteParticipants.map((p): StageTile => ({
		kind: 'participant',
		id: p.id,
		displayName: p.displayName,
		avatarUrl: p.avatarUrl,
		muted: p.muted,
		held: p.held,
		cameraStream: p.cameraStream,
	})),
];

/** How much a tile deserves one of the few visible slots: a camera, then the reader. */
const tilePriority = (tile: StageTile, selfId: string): number => (tile.cameraStream ? 100 : 0) + (tile.id === selfId ? 50 : 0);

/**
 * Splits tiles into what fits in `capacity` slots and what does not. When they do not all fit, one slot goes to the
 * overflow tile, and the highest-priority tiles take the rest, keeping their order.
 */
export const splitByPriority = (tiles: StageTile[], capacity: number, selfId: string): { visible: StageTile[]; hidden: StageTile[] } => {
	if (tiles.length <= capacity) {
		return { visible: tiles, hidden: [] };
	}
	const slots = Math.max(0, capacity - 1);
	const ranked = tiles.map((tile, index) => ({ index, score: tilePriority(tile, selfId) })).sort((a, b) => b.score - a.score);
	const shown = new Set(ranked.slice(0, slots).map(({ index }) => index));
	return {
		visible: tiles.filter((_, i) => shown.has(i)),
		hidden: tiles.filter((_, i) => !shown.has(i)),
	};
};

/**
 * Keeps a single tile from sitting alone on the last row: when there is already an overflow tile, the last visible
 * tile joins it so the row fills up. `leadingCells` are the grid's cells before the tiles, such as shared screens.
 */
export const absorbLonelyTile = (
	visible: StageTile[],
	hidden: StageTile[],
	cols: number,
	leadingCells = 0,
): { visible: StageTile[]; hidden: StageTile[] } => {
	const count = leadingCells + visible.length + (hidden.length > 0 ? 1 : 0);
	if (cols > 1 && visible.length > 0 && hidden.length > 0 && count % cols === 1) {
		return { visible: visible.slice(0, -1), hidden: [visible[visible.length - 1], ...hidden] };
	}
	return { visible, hidden };
};

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
