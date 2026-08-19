/**
 * Runs in the `client` project, whose jsdom environment provides a `window` but no `CSS` object at
 * all, so a browser's `CSS.supports` is what the stub below stands in for.
 *
 * `cssSupports` picks its implementation when the module is first evaluated, so every case resets
 * the module registry and sets up `window.CSS` before importing.
 */

const stubCSSSupports = (supports: (value: string) => boolean): void => {
	Object.defineProperty(window, 'CSS', {
		value: { supports },
		configurable: true,
		writable: true,
	});
};

beforeEach(() => {
	jest.resetModules();
	Reflect.deleteProperty(window, 'CSS');
});

afterEach(() => {
	Reflect.deleteProperty(window, 'CSS');
});

describe('with no CSS.supports to delegate to', () => {
	it('should report every query as unsupported', async () => {
		expect(window.CSS).toBeUndefined();

		const { cssSupports } = await import('./index');

		expect(cssSupports('display:flex')).toBe(false);
	});
});

describe('with CSS.supports available', () => {
	it('should delegate the query and relay the answer', async () => {
		const supports = jest.fn((value: string) => value === 'display:flex');
		stubCSSSupports(supports);

		const { cssSupports } = await import('./index');

		expect(cssSupports('display:flex')).toBe(true);
		expect(cssSupports('display:grid')).toBe(false);
		expect(supports).toHaveBeenCalledWith('display:flex');
		expect(supports).toHaveBeenCalledWith('display:grid');
	});

	it('should evaluate each distinct query only once', async () => {
		const supports = jest.fn(() => true);
		stubCSSSupports(supports);

		const { cssSupports } = await import('./index');

		cssSupports('display:flex');
		cssSupports('display:flex');
		cssSupports('display:grid');

		expect(supports).toHaveBeenCalledTimes(2);
	});
});
