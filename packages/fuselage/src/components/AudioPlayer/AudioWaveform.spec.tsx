import { fitPeaks, layoutBars } from './AudioWaveform';

describe('layoutBars', () => {
	const used = ({ count, gap }: { count: number; gap: number }) => count * 3 + (count - 1) * gap;

	it('draws every peak with the narrowest gap when they fill the width', () => {
		expect(layoutBars(162, 40)).toEqual({ count: 40, gap: 1 });
	});

	it('merges peaks into fewer bars when they do not fit', () => {
		expect(layoutBars(58, 40)).toEqual({ count: 14, gap: 1 });
	});

	it('widens the gap instead of leaving a wide width empty', () => {
		const layout = layoutBars(400, 40);
		expect(layout.gap).toBeGreaterThan(1);
		expect(400 - used(layout)).toBeLessThan(3 + layout.gap);
	});

	it('keeps every peak that fits at the narrowest gap', () => {
		expect(layoutBars(368, 10)).toEqual({ count: 10, gap: 37 });
		for (const maxBars of [10, 40, 64]) {
			for (let width = 3; width <= 400; width++) {
				expect(layoutBars(width, maxBars).count).toBe(Math.min(maxBars, Math.floor((width + 1) / 4)));
			}
		}
	});

	it('never overflows the width', () => {
		for (let width = 3; width <= 400; width++) {
			expect(used(layoutBars(width, 40))).toBeLessThanOrEqual(width);
		}
	});
});

describe('fitPeaks', () => {
	it('keeps the peaks when they fit', () => {
		const peaks = [0.1, 0.5, 0.9];
		expect(fitPeaks(peaks, 3)).toBe(peaks);
		expect(fitPeaks(peaks, 10)).toBe(peaks);
	});

	it('merges neighbouring peaks into the loudest one', () => {
		expect(fitPeaks([0.1, 0.5, 0.9, 0.2, 0.3, 0.4], 3)).toEqual([0.5, 0.9, 0.4]);
	});

	it('covers every peak when the count does not divide evenly', () => {
		expect(fitPeaks([0.1, 0.2, 0.3, 0.4, 1], 2)).toEqual([0.2, 1]);
	});
});
