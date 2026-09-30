import { backdropTint } from './backdropTint';

describe('backdropTint', () => {
	it('gives the same name the same tint every time', () => {
		expect(backdropTint('Ada Lovelace')).toBe(backdropTint('Ada Lovelace'));
		expect(backdropTint('')).toMatch(/^#[0-9a-f]{8}$/);
	});

	// Telling people apart is its whole purpose.
	it('gives different names different tints', () => {
		const names = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'John Doe'];
		expect(new Set(names.map(backdropTint)).size).toBeGreaterThan(1);
	});
});
