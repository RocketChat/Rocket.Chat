import { isAbsoluteURL } from './isAbsoluteURL';

describe('isAbsoluteURL', () => {
	test.each([
		['/', false],
		['test', false],
		['test/test', false],
		['.', false],
		['./test', false],
		['/absolute/path', false],
		['relative/path?query=1', false],
		['ftp://example.com', false],
	])('should return false for non-absolute URL %# (%s)', (input, expected) => {
		expect(isAbsoluteURL(input)).toBe(expected);
	});

	test.each([
		['https://rocket.chat', true],
		['http://rocket.chat', true],
		['https://example.com/path?query=1#hash', true],
		['http://localhost:3000', true],
		['data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', true],
		['data:text/plain;charset=utf-8,Hello', true],
	])('should return true for absolute URL %# (%s)', (input, expected) => {
		expect(isAbsoluteURL(input)).toBe(expected);
	});
});
