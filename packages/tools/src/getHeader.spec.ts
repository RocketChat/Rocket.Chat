import type { IncomingHttpHeaders } from 'http';

import { getHeader } from './getHeader';

describe('getHeader', () => {
	describe('default mode (string)', () => {
		it('returns empty string when headers is undefined', () => {
			expect(getHeader(undefined as unknown as IncomingHttpHeaders, 'origin')).toBe('');
		});

		it('returns empty string when header does not exist', () => {
			expect(getHeader({ origin: 'localhost:3000' }, 'host')).toBe('');
		});

		it('returns header value when it exists', () => {
			expect(getHeader({ origin: 'localhost:3000' }, 'origin')).toBe('localhost:3000');
		});

		it('returns empty string when headers is empty object', () => {
			expect(getHeader({}, 'origin')).toBe('');
		});

		it('returns first value when header is array', () => {
			expect(getHeader({ 'x-forwarded-for': ['127.0.0.1', '10.0.0.1'] }, 'x-forwarded-for')).toBe('127.0.0.1');
		});

		it('returns empty string when value is empty array', () => {
			expect(getHeader({ 'x-forwarded-for': [] }, 'x-forwarded-for')).toBe('');
		});

		it('returns empty string when value is undefined', () => {
			expect(getHeader({ origin: undefined }, 'origin')).toBe('');
		});
	});

	describe('asArray mode (string[])', () => {
		it('returns empty array when headers is undefined', () => {
			expect(getHeader(undefined as unknown as IncomingHttpHeaders, 'origin', true)).toEqual([]);
		});

		it('returns empty array when header does not exist', () => {
			expect(getHeader({ origin: 'localhost:3000' }, 'host', true)).toEqual([]);
		});

		it('returns array with single value when header is string', () => {
			expect(getHeader({ origin: 'localhost:3000' }, 'origin', true)).toEqual(['localhost:3000']);
		});

		it('returns array when header already array', () => {
			expect(getHeader({ 'x-forwarded-for': ['127.0.0.1', '10.0.0.1'] }, 'x-forwarded-for', true)).toEqual(['127.0.0.1', '10.0.0.1']);
		});

		it('returns empty array when value is empty array', () => {
			expect(getHeader({ 'x-forwarded-for': [] }, 'x-forwarded-for', true)).toEqual([]);
		});
	});

	describe('IncomingHttpHeaders support', () => {
		it('works with IncomingHttpHeaders', () => {
			const headers: IncomingHttpHeaders = {
				host: 'localhost:3000',
				connection: 'keep-alive',
			};

			expect(getHeader(headers, 'host')).toBe('localhost:3000');
			expect(getHeader(headers, 'origin')).toBe('');
		});
	});

	describe('Headers support', () => {
		it('works with Headers', () => {
			const headers = new Headers();
			headers.set('host', 'localhost:3000');

			expect(getHeader(headers, 'host')).toBe('localhost:3000');
			expect(getHeader(headers, 'origin')).toEqual('');
		});
	});
});
