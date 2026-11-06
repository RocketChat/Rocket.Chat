import { getPlacement } from './helpers';

describe('getPlacement', () => {
	it.each([
		['top-middle', 'top'],
		['right-middle', 'right'],
		['bottom-middle', 'bottom'],
		['left-middle', 'left'],
	] as const)('maps %s to the centered %s placement', (placement, expected) => {
		expect(getPlacement(placement)).toBe(expected);
	});

	it('keeps mapping edge-aligned placements', () => {
		expect(getPlacement('bottom-start')).toBe('bottom start');
		expect(getPlacement('left-end')).toBe('left bottom');
	});
});
