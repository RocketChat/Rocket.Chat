import { SPEAKING_THRESHOLD, backdropTint, speakingRingLevel, speakingRingThickness } from './speakingRing';

describe('speakingRingLevel', () => {
	it('shows nothing at or below the threshold', () => {
		expect(speakingRingLevel(0)).toBe(0);
		expect(speakingRingLevel(SPEAKING_THRESHOLD)).toBe(0);
	});

	// Just over the threshold is still clearly a ring, not a one-pixel hint.
	it('is clearly visible just over the threshold and full at full volume', () => {
		expect(speakingRingLevel(SPEAKING_THRESHOLD + 0.001)).toBeCloseTo(0.55, 2);
		expect(speakingRingLevel(1)).toBe(1);
	});
});

describe('speakingRingThickness', () => {
	it('is thinner on a thumbnail', () => {
		expect(speakingRingThickness(1, false)).toBe(4);
		expect(speakingRingThickness(1, true)).toBe(3);
		expect(speakingRingThickness(0, false)).toBe(0);
	});
});

describe('backdropTint', () => {
	it('gives the same name the same tint every time', () => {
		expect(backdropTint('Ada Lovelace')).toBe(backdropTint('Ada Lovelace'));
		expect(backdropTint('')).toMatch(/^#[0-9a-f]{8}$/);
	});
});
