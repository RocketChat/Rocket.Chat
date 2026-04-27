/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://secure.example.com/"}
 */

jest.mock('./baseURI', () => ({
	baseURI: 'https://secure.example.com/',
}));

describe('absoluteUrl module-level initialization with https location', () => {
	it('should set secure to true when window.location.protocol is https:', async () => {
		let mod: typeof import('./absoluteUrl') | undefined;
		await jest.isolateModulesAsync(async () => {
			mod = await import('./absoluteUrl');
		});

		expect(mod?.absoluteUrl.defaultOptions.secure).toBe(true);
		expect(mod?.absoluteUrl.defaultOptions.rootUrl).toBe('https://secure.example.com');
	});
});
