/**
 * `cssSupports` picks its implementation when the module is first evaluated, so every case here
 * resets the module registry and sets up the globals it wants before importing.
 */

const stubWindow = (css: { supports?: (value: string) => boolean } | undefined): void => {
	Object.defineProperty(globalThis, 'window', {
		value: { CSS: css },
		configurable: true,
		writable: true,
	});
};

beforeEach(() => {
	jest.resetModules();
	Reflect.deleteProperty(globalThis, 'window');
});

afterEach(() => {
	Reflect.deleteProperty(globalThis, 'window');
});

describe('with no window at all (server-side rendering)', () => {
	it('should report every query as unsupported instead of throwing', async () => {
		const { cssSupports } = await import('./index');

		expect(cssSupports('display:flex')).toBe(false);
		expect(cssSupports('margin-inline-start:0')).toBe(false);
	});
});

describe('with a window lacking CSS.supports', () => {
	it('should report every query as unsupported', async () => {
		stubWindow(undefined);

		const { cssSupports } = await import('./index');

		expect(cssSupports('display:flex')).toBe(false);
	});
});

describe('with a window exposing CSS.supports', () => {
	it('should delegate the query and relay the answer', async () => {
		const supports = jest.fn((value: string) => value === 'display:flex');
		stubWindow({ supports });

		const { cssSupports } = await import('./index');

		expect(cssSupports('display:flex')).toBe(true);
		expect(cssSupports('display:grid')).toBe(false);
		expect(supports).toHaveBeenCalledWith('display:flex');
		expect(supports).toHaveBeenCalledWith('display:grid');
	});

	it('should evaluate each distinct query only once', async () => {
		const supports = jest.fn(() => true);
		stubWindow({ supports });

		const { cssSupports } = await import('./index');

		cssSupports('display:flex');
		cssSupports('display:flex');
		cssSupports('display:grid');

		expect(supports).toHaveBeenCalledTimes(2);
	});
});
