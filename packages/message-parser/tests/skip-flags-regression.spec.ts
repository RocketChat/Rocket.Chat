import { parse } from '../src';

describe('Skip Flags Regression (Complexity Audit)', () => {
	const measureDepth = (depth: number) => {
		const input = `${'*'.repeat(depth)}text${'*'.repeat(depth)}`;
		const start = performance.now();
		parse(input);
		return performance.now() - start;
	};

	it('should log timing data for nested formatting depths', () => {
		const times: Record<number, number> = {};
		for (let d = 1; d <= 7; d++) {
			times[d] = measureDepth(d);
		}

		console.table(Object.entries(times).map(([depth, time]) => ({ depth, 'time (ms)': time.toFixed(4) })));

		// If d=7 takes significantly longer than linear growth from d=1
		// we have confirmed the problem.
		expect(times[7]).toBeDefined();
	});

	it('should handle pathological unmatched markers without crashing', () => {
		const pathological = '*_~*_~*_~*_~*_~ hello'.repeat(5);
		expect(() => parse(pathological)).not.toThrow();
	});
});
