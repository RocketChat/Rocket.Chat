/**
 * Runs in the `server` project, whose environment has no `window` at all — the server-side
 * rendering path `cssSupports` has to survive.
 */

it('should report every query as unsupported instead of throwing', async () => {
	expect(typeof window).toBe('undefined');

	const { cssSupports } = await import('./index');

	expect(cssSupports('display:flex')).toBe(false);
	expect(cssSupports('margin-inline-start:0')).toBe(false);
});
