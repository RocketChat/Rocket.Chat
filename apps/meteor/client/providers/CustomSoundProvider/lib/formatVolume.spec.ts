import { formatVolume } from './formatVolume';

describe('formatVolume', () => {
	it('returns 1 if volume is 100', () => {
		expect(formatVolume(100)).toBe(1);
	});

	it('returns 1 if volume is 200', () => {
		expect(formatVolume(200)).toBe(1);
	});

	it('returns 0.5 if volume is 50', () => {
		expect(formatVolume(50)).toBe(0.5);
	});

	it('returns 0 if volume is -10', () => {
		expect(formatVolume(-10)).toBe(0);
	});
});
