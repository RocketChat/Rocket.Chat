import type { StageTile } from './stageTiles';
import {
	absorbLonelyTile,
	buildStageTiles,
	gridCellKeys,
	gridColumnStartFor,
	pickFeaturedTile,
	sidebarCapacity,
	splitByPriority,
	spotlightOrientation,
} from './stageTiles';

const stream = {} as MediaStream;

const tile = (id: string, extra: Partial<StageTile> = {}): StageTile => ({
	id,
	displayName: id,
	muted: false,
	held: false,
	mirrored: false,
	muteVideoAudio: false,
	...extra,
});

const tiles = (count: number) => Array.from({ length: count }, (_, i) => tile(`p${i}`));

describe('buildStageTiles', () => {
	it('puts the reader first, mirrored and silenced, with their hand position and send height', () => {
		const [self, remote] = buildStageTiles(
			{ id: 'me', displayName: 'Me', muted: true, held: false, sendHeight: 720 },
			[{ id: 'ada', displayName: 'Ada', muted: false, held: false }],
			{ ada: 1 },
		);

		expect(self).toMatchObject({ id: 'me', mirrored: true, muteVideoAudio: true, sendHeight: 720, handPosition: undefined });
		expect(remote).toMatchObject({ id: 'ada', mirrored: false, muteVideoAudio: false, handPosition: 1 });
		// A claim about someone else's encoder is not one this client can make.
		expect(remote).not.toHaveProperty('sendHeight');
	});
});

describe('pickFeaturedTile', () => {
	const all = [tile('me'), tile('ada'), tile('bob')];

	it('features whoever is speaking', () => {
		expect(pickFeaturedTile(all, 'bob', 'me').id).toBe('bob');
	});

	it('falls back to the first person who is not the reader', () => {
		expect(pickFeaturedTile(all, null, 'me').id).toBe('ada');
	});

	it('features the reader when they are alone', () => {
		expect(pickFeaturedTile([tile('me')], null, 'me').id).toBe('me');
	});
});

describe('splitByPriority', () => {
	it('shows everyone when they fit', () => {
		const all = tiles(9);
		expect(splitByPriority(all, 9, null, 'p0')).toEqual({ visible: all, hidden: [] });
	});

	// One slot goes to the overflow tile, so ten people in nine slots show eight.
	it('keeps one slot for the overflow tile', () => {
		const { visible, hidden } = splitByPriority(tiles(10), 9, null, 'p0');
		expect(visible).toHaveLength(8);
		expect(hidden).toHaveLength(2);
	});

	it('ranks the speaker, then cameras, then the reader, and keeps the call order among the shown', () => {
		const all = [tile('p0'), tile('p1'), tile('p2', { cameraStream: stream }), tile('p3'), tile('p4')];
		const { visible, hidden } = splitByPriority(all, 4, 'p4', 'p1');
		expect(visible.map(({ id }) => id)).toEqual(['p1', 'p2', 'p4']);
		expect(hidden.map(({ id }) => id)).toEqual(['p0', 'p3']);
	});

	it('shows nothing but the overflow when a single slot is left', () => {
		const { visible, hidden } = splitByPriority(tiles(3), 1, null, 'p0');
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

	it('does nothing without an overflow to fold into', () => {
		const visible = tiles(4);
		expect(absorbLonelyTile(visible, [], 3)).toEqual({ visible, hidden: [] });
	});
});

describe('gridCellKeys', () => {
	it('names the cells in render order, the overflow last', () => {
		expect(gridCellKeys(tiles(2), [tile('x')])).toEqual(['p0', 'p1', 'overflow']);
		expect(gridCellKeys(tiles(2), [])).toEqual(['p0', 'p1']);
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

describe('spotlightOrientation', () => {
	it('puts the thumbs beside a wide stage and under a narrow one', () => {
		expect(spotlightOrientation({ width: 1500, height: 1000 })).toBe('side-by-side');
		expect(spotlightOrientation({ width: 1400, height: 1000 })).toBe('stacked');
		expect(spotlightOrientation({ width: 0, height: 0 })).toBe('stacked');
	});
});

describe('sidebarCapacity', () => {
	it('is unbounded until the stage is measured', () => {
		expect(sidebarCapacity({ width: 0, height: 500 }, 'stacked')).toBe(Infinity);
	});

	it('counts the thumbs that fit along the column or the strip, never fewer than one', () => {
		expect(sidebarCapacity({ width: 1600, height: 600 }, 'side-by-side')).toBe(4);
		expect(sidebarCapacity({ width: 600, height: 800 }, 'stacked')).toBe(4);
		expect(sidebarCapacity({ width: 50, height: 800 }, 'stacked')).toBe(1);
	});
});
