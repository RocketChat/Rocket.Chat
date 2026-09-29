import type { StageTile, TileParticipant } from './stageTiles';
import { absorbLonelyTile, buildStageTiles, gridColumnStartFor, splitByPriority } from './stageTiles';

const stream = {} as MediaStream;

const tile = (id: string, extra: Partial<TileParticipant> = {}): StageTile => ({
	kind: 'participant',
	id,
	displayName: id,
	muted: false,
	held: false,
	...extra,
});

const tiles = (count: number) => Array.from({ length: count }, (_, i) => tile(`p${i}`));

describe('buildStageTiles', () => {
	it('puts the reader first', () => {
		const [self, remote] = buildStageTiles({ id: 'me', displayName: 'Me', muted: true, held: false }, [
			{ id: 'ada', displayName: 'Ada', muted: false, held: false },
		]);

		expect(self).toMatchObject({ kind: 'self', id: 'me' });
		expect(remote).toMatchObject({ kind: 'participant', id: 'ada' });
	});
});

describe('splitByPriority', () => {
	it('shows everyone when they fit', () => {
		const all = tiles(9);
		expect(splitByPriority(all, 9, 'p0')).toEqual({ visible: all, hidden: [] });
	});

	// One slot goes to the overflow tile, so ten people in nine slots show eight.
	it('keeps one slot for the overflow tile', () => {
		const { visible, hidden } = splitByPriority(tiles(10), 9, 'p0');
		expect(visible).toHaveLength(8);
		expect(hidden).toHaveLength(2);
	});

	it('ranks cameras, then the reader, and keeps the call order among the shown', () => {
		const all = [tile('p0'), tile('p1'), tile('p2', { cameraStream: stream }), tile('p3'), tile('p4')];
		const { visible, hidden } = splitByPriority(all, 3, 'p1');
		expect(visible.map(({ id }) => id)).toEqual(['p1', 'p2']);
		expect(hidden.map(({ id }) => id)).toEqual(['p0', 'p3', 'p4']);
	});

	it('shows nothing but the overflow when a single slot is left', () => {
		const { visible, hidden } = splitByPriority(tiles(3), 1, 'p0');
		expect(visible).toEqual([]);
		expect(hidden).toHaveLength(3);
	});
});

describe('absorbLonelyTile', () => {
	// Eight visible and an overflow in three columns: nine cells, a full last row, nothing to do.
	it('leaves a full last row alone', () => {
		const visible = tiles(8);
		const hidden = [tile('x')];
		expect(absorbLonelyTile(visible, hidden, 3)).toEqual({ visible, hidden });
	});

	// Six visible and an overflow in three columns leaves the overflow alone on its row.
	it('folds the last visible tile into the overflow', () => {
		const result = absorbLonelyTile(tiles(6), [tile('x')], 3);
		expect(result.visible.map(({ id }) => id)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4']);
		expect(result.hidden.map(({ id }) => id)).toEqual(['p5', 'x']);
	});

	// Two screens ahead of four visible tiles and an overflow in three columns: the overflow would sit alone.
	it('counts the cells before the tiles', () => {
		const result = absorbLonelyTile(tiles(4), [tile('x')], 3, 2);
		expect(result.visible.map(({ id }) => id)).toEqual(['p0', 'p1', 'p2']);
		expect(result.hidden.map(({ id }) => id)).toEqual(['p3', 'x']);
	});

	// Screens can fill the grid, leaving the overflow tile the only one for people.
	it('has nothing to fold when no tile is visible', () => {
		const hidden = tiles(2);
		expect(absorbLonelyTile([], hidden, 3, 9)).toEqual({ visible: [], hidden });
	});

	it('does nothing without an overflow to fold into', () => {
		const visible = tiles(4);
		expect(absorbLonelyTile(visible, [], 3)).toEqual({ visible, hidden: [] });
	});
});

describe('gridColumnStartFor', () => {
	it('leaves cells on full rows where the grid puts them', () => {
		expect(gridColumnStartFor(0, 6, 3)).toBeUndefined();
		expect(gridColumnStartFor(2, 5, 3)).toBeUndefined();
	});

	// Five cells in three columns: the two on the last row start at columns 1 and 2 of a centred pair.
	it('centres a short last row', () => {
		expect(gridColumnStartFor(3, 5, 3)).toBe(1);
		expect(gridColumnStartFor(4, 5, 3)).toBe(2);
		expect(gridColumnStartFor(4, 5, 4)).toBe(2);
		expect(gridColumnStartFor(6, 7, 3)).toBe(2);
	});
});
