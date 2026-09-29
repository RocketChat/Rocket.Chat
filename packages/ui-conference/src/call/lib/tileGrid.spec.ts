import { flipOffset } from './tileFlip';
import { clampCellToAspectBand, gridBox, pickTileGridLayout, tileGridLayout } from './tileGrid';

describe('pickTileGridLayout', () => {
	it('puts a single tile, or an unmeasured container, on one row', () => {
		expect(pickTileGridLayout(1, 1000, 600)).toEqual({ rows: 1, cols: 1 });
		expect(pickTileGridLayout(4, 0, 0)).toEqual({ rows: 1, cols: 4 });
	});

	it('lays four tiles out two by two in a widescreen container', () => {
		expect(pickTileGridLayout(4, 1600, 900)).toEqual({ rows: 2, cols: 2 });
	});

	// In a phone held upright, side by side would make every tile a sliver.
	it('stacks tiles in a tall container', () => {
		expect(pickTileGridLayout(2, 400, 800)).toEqual({ rows: 2, cols: 1 });
	});
});

describe('clampCellToAspectBand', () => {
	it('narrows a cell wider than 16:9 and shortens one taller than 3:4', () => {
		expect(clampCellToAspectBand(1000, 100)).toEqual({ width: (100 * 16) / 9, height: 100 });
		expect(clampCellToAspectBand(300, 1000)).toEqual({ width: 300, height: 400 });
		expect(clampCellToAspectBand(400, 300)).toEqual({ width: 400, height: 300 });
	});
});

describe('tileGridLayout and gridBox', () => {
	it('sizes the cells with the gutters taken out, and the grid back from them', () => {
		const layout = tileGridLayout(4, 1608, 908);
		expect(layout).toEqual({ rows: 2, cols: 2, cellWidth: 800, cellHeight: 450 });
		expect(gridBox(layout)).toEqual({ width: 1608, height: 908 });
	});

	it('has no size until the cells have been measured', () => {
		expect(gridBox({ rows: 1, cols: 1, cellWidth: 0, cellHeight: 0 })).toEqual({ width: undefined, height: undefined });
	});
});

describe('flipOffset', () => {
	it('says how far a tile moved, and nothing for a move too small to see', () => {
		expect(flipOffset({ left: 100, top: 50 }, { left: 20, top: 50 })).toEqual({ dx: 80, dy: 0 });
		expect(flipOffset({ left: 100, top: 50 }, { left: 99.5, top: 50.5 })).toBeNull();
	});
});
