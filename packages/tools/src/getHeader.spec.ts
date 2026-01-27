import type { IncomingHttpHeaders } from 'http';

import { getHeader } from './getHeader';

describe('getHeader', () => {
	it('returns empty string when headers is undefined', () => {
		expect(getHeader(undefined as unknown as IncomingHttpHeaders, 'origin')).toBe('');
	});

	it('returns empty string when header does not exist', () => {
		expect(getHeader({ origin: 'localhost:3000' }, 'host')).toBe('');
	});

	it('returns the header value when it exists', () => {
		expect(getHeader({ origin: 'localhost:3000' }, 'origin')).toBe('localhost:3000');
	});

	it('returns empty string when headers is an empty object', () => {
		expect(getHeader({}, 'origin')).toBe('');
	});

	it('returns first value when header is an array', () => {
		expect(getHeader({ 'x-forwarded-for': ['127.0.0.1', '10.0.0.1'] }, 'x-forwarded-for')).toBe('127.0.0.1');
	});

	it('returns empty string when value is an empty array', () => {
		expect(getHeader({ 'x-forwarded-for': [] }, 'x-forwarded-for')).toBe('');
	});

	it('returns empty string when header value is undefined', () => {
		expect(getHeader({ origin: undefined }, 'origin')).toBe('');
	});

	it('works with IncomingHttpHeaders shape', () => {
		const headers: IncomingHttpHeaders = {
			host: 'localhost:3000',
			connection: 'keep-alive',
		};

		expect(getHeader(headers, 'host')).toBe('localhost:3000');
	});
});
