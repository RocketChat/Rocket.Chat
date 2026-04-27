import { absoluteUrl, _relativeToSiteRootUrl } from './absoluteUrl';

jest.mock('./baseURI', () => ({
	baseURI: 'http://localhost:3000/',
}));

beforeEach(() => {
	absoluteUrl.defaultOptions = { rootUrl: 'http://localhost:3000/' };
});

describe('absoluteUrl', () => {
	it('should return the root URL with a trailing slash when no path is given', () => {
		expect(absoluteUrl(undefined, { rootUrl: 'http://example.com' })).toBe('http://example.com/');
	});

	it('should append the path to the root URL', () => {
		expect(absoluteUrl('foo/bar', { rootUrl: 'http://example.com' })).toBe('http://example.com/foo/bar');
	});

	it('should strip leading slashes from the path', () => {
		expect(absoluteUrl('///foo', { rootUrl: 'http://example.com' })).toBe('http://example.com/foo');
	});

	it('should prepend http:// when the rootUrl has no protocol', () => {
		expect(absoluteUrl(undefined, { rootUrl: 'example.com' })).toBe('http://example.com/');
	});

	it('should preserve https:// when already present in rootUrl', () => {
		expect(absoluteUrl('path', { rootUrl: 'https://example.com' })).toBe('https://example.com/path');
	});

	it('should throw when rootUrl is not provided and defaultOptions.rootUrl is unset', () => {
		absoluteUrl.defaultOptions = {};
		expect(() => absoluteUrl()).toThrow('Must pass options.rootUrl or set ROOT_URL in the server environment');
	});

	it('should use defaultOptions.rootUrl when no rootUrl option is given', () => {
		absoluteUrl.defaultOptions = { rootUrl: 'http://default.example.com' };
		expect(absoluteUrl('test')).toBe('http://default.example.com/test');
	});

	it('should upgrade http to https when secure is true and host is not localhost', () => {
		expect(absoluteUrl('path', { rootUrl: 'http://example.com', secure: true })).toBe('https://example.com/path');
	});

	it('should not upgrade to https for localhost when secure is true', () => {
		expect(absoluteUrl('path', { rootUrl: 'http://localhost:3000', secure: true })).toBe('http://localhost:3000/path');
	});

	it('should not upgrade to https for 127.0.0.1 when secure is true', () => {
		expect(absoluteUrl('path', { rootUrl: 'http://127.0.0.1:3000', secure: true })).toBe('http://127.0.0.1:3000/path');
	});

	it('should replace localhost with 127.0.0.1 when replaceLocalhost is true', () => {
		expect(absoluteUrl('path', { rootUrl: 'http://localhost:3000', replaceLocalhost: true })).toBe('http://127.0.0.1:3000/path');
	});

	it('should not replace localhost when replaceLocalhost is false', () => {
		expect(absoluteUrl('path', { rootUrl: 'http://localhost:3000', replaceLocalhost: false })).toBe('http://localhost:3000/path');
	});

	it('should accept options as the first argument when path is omitted', () => {
		expect(absoluteUrl({ rootUrl: 'http://example.com' } as any)).toBe('http://example.com/');
	});

	it('should not duplicate trailing slash', () => {
		expect(absoluteUrl(undefined, { rootUrl: 'http://example.com/' })).toBe('http://example.com/');
	});
});

describe('_relativeToSiteRootUrl', () => {
	const originalConfig = (globalThis as any).__meteor_runtime_config__;

	afterEach(() => {
		(globalThis as any).__meteor_runtime_config__ = originalConfig;
	});

	it('should prepend ROOT_URL_PATH_PREFIX to links starting with /', () => {
		(globalThis as any).__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '/subdir' };
		expect(_relativeToSiteRootUrl('/route')).toBe('/subdir/route');
	});

	it('should return the link unchanged when it does not start with /', () => {
		(globalThis as any).__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '/subdir' };
		expect(_relativeToSiteRootUrl('route')).toBe('route');
	});

	it('should return the link unchanged when __meteor_runtime_config__ is not an object', () => {
		delete (globalThis as any).__meteor_runtime_config__;
		expect(_relativeToSiteRootUrl('/route')).toBe('/route');
	});

	it('should handle empty ROOT_URL_PATH_PREFIX', () => {
		(globalThis as any).__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '' };
		expect(_relativeToSiteRootUrl('/route')).toBe('/route');
	});
});

describe('defaultOptions', () => {
	it('should initialize rootUrl from baseURI', () => {
		expect(absoluteUrl.defaultOptions.rootUrl).toBe('http://localhost:3000/');
	});

	it('should initialize secure from window.isSecureContext', () => {
		expect(absoluteUrl.defaultOptions.secure).toBe(window.isSecureContext);
	});
});
