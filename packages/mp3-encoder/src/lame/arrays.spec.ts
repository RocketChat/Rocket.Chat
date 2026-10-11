import { sortArray } from './arrays';

test('sortArray sorts only the given range, numerically', () => {
	const a = new Float32Array([5, 10, 9, 0.5, 2, 1]);

	sortArray(a, 1, 4);

	expect(Array.from(a)).toEqual([5, 0.5, 9, 10, 2, 1]);
});
