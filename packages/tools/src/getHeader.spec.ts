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

		it('returns empty string when value is undefined', () => {
			expect(getHeader({ origin: undefined }, 'origin')).toBe('');
		});
	});

	describe('generic array mode (string[])', () => {
		it('returns the correct array when header is array', () => {
			expect(getHeader<string[]>({ 'x-forwarded-for': ['127.0.0.1', '10.0.0.1'] }, 'x-forwarded-for')).toStrictEqual([
				'127.0.0.1',
				'10.0.0.1',
			]);
		});

		it('returns empty array when value is empty array', () => {
			expect(getHeader<string[]>({ 'x-forwarded-for': [] }, 'x-forwarded-for')).toStrictEqual([]);
		});

		it('returns string even when T is string[] (by design)', () => {
			expect(getHeader<string[]>({ origin: 'localhost:3000' }, 'origin')).toEqual('localhost:3000');
		});
	});

	describe('IncomingHttpHeaders support', () => {
		it('works with IncomingHttpHeaders', () => {
			const headers: IncomingHttpHeaders = {
				connection: 'keep-alive',
			};

			expect(getHeader(headers, 'connection')).toBe('keep-alive');
			expect(getHeader(headers, 'origin')).toBe('');
		});
	});

	describe('Headers support', () => {
		it('works with Headers', () => {
			const headers = new Headers();
			headers.set('host', 'localhost:3000');

			expect(getHeader(headers, 'host')).toBe('localhost:3000');
			expect(getHeader(headers, 'origin')).toBe('');
		});
	});
});
