import { BLUR_STRENGTH, cameraBlurCapability } from './useBackgroundBlur';

// Three levels that produce the same picture are one level with two decoys — which is what the previous
// implementation shipped, since the library divided every radius by four and clamped it to a minimum of one.
it('gives each level a different amount of blur', () => {
	const strengths = Object.values(BLUR_STRENGTH);

	expect(new Set(strengths).size).toBe(strengths.length);
});

it('offers them weakest first, so the menu reads in order', () => {
	const { light, medium, strong } = BLUR_STRENGTH;

	expect(light).toBeLessThan(medium);
	expect(medium).toBeLessThan(strong);
});

// They are fractions of the frame's height, not pixels. A pixel count would read as three times lighter at 1080p
// than at 360p, because the viewer sees the frame scaled to a tile either way.
it('measures blur against the frame rather than in pixels', () => {
	Object.values(BLUR_STRENGTH).forEach((strength) => {
		expect(strength).toBeGreaterThan(0);
		expect(strength).toBeLessThan(0.5);
	});
});

it('only treats a two-value camera blur capability as controllable', () => {
	expect(cameraBlurCapability([false, true])).toBe('controllable');
	expect(cameraBlurCapability([true])).toBe('fixed');
	expect(cameraBlurCapability([false])).toBe('none');
	expect(cameraBlurCapability(undefined)).toBe('none');
});
