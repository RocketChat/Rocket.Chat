import { backdropTint } from './backdropTint';

describe('backdropTint', () => {
	it('gives the same name the same tint every time', () => {
		expect(backdropTint('Ada Lovelace')).toBe(backdropTint('Ada Lovelace'));
		expect(backdropTint('')).toMatch(/^#[0-9a-f]{8}$/);
	});
});
