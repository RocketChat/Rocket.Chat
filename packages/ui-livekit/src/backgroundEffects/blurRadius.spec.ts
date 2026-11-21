import { blurRadiusFor } from './blurRadius';

it('keeps the three levels apart at every resolution, stronger in order', () => {
	for (const height of [180, 360, 720, 1080]) {
		const light = blurRadiusFor('light', height);
		const medium = blurRadiusFor('medium', height);
		const strong = blurRadiusFor('strong', height);
		// The library divides the radius by four, so the quarters must differ.
		expect(Math.floor(light / 4)).toBeLessThan(Math.floor(medium / 4));
		expect(Math.floor(medium / 4)).toBeLessThan(Math.floor(strong / 4));
	}
});

it('scales with the frame height above the floors', () => {
	expect(blurRadiusFor('medium', 1080)).toBe(36);
	expect(blurRadiusFor('medium', 180)).toBe(8);
});
