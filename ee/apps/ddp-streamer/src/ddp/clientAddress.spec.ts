import type { IncomingMessage } from 'http';

import { getClientAddress } from './clientAddress';

function makeRequest(forwardedFor?: string | string[], remoteAddress = '10.0.0.1'): IncomingMessage {
	return {
		headers: forwardedFor === undefined ? {} : { 'x-forwarded-for': forwardedFor },
		socket: { remoteAddress },
	} as unknown as IncomingMessage;
}

describe('getClientAddress', () => {
	const originalCount = process.env.HTTP_FORWARDED_COUNT;

	afterEach(() => {
		if (originalCount === undefined) {
			delete process.env.HTTP_FORWARDED_COUNT;
		} else {
			process.env.HTTP_FORWARDED_COUNT = originalCount;
		}
	});

	it.each([undefined, '', '0', 'not-a-number'])('uses the socket address when HTTP_FORWARDED_COUNT is %p', (count) => {
		if (count === undefined) {
			delete process.env.HTTP_FORWARDED_COUNT;
		} else {
			process.env.HTTP_FORWARDED_COUNT = count;
		}

		expect(getClientAddress(makeRequest('1.1.1.1, 2.2.2.2'))).toBe('10.0.0.1');
	});

	it.each([
		['1', '2.2.2.2'],
		['2', '1.1.1.1'],
	])('counts %s hops back from the end of x-forwarded-for', (count, expected) => {
		process.env.HTTP_FORWARDED_COUNT = count;

		expect(getClientAddress(makeRequest(' 1.1.1.1 ,2.2.2.2 '))).toBe(expected);
	});

	it('returns undefined when the header is missing or has fewer hops than configured', () => {
		process.env.HTTP_FORWARDED_COUNT = '3';

		expect(getClientAddress(makeRequest())).toBeUndefined();
		expect(getClientAddress(makeRequest('1.1.1.1, 2.2.2.2'))).toBeUndefined();
	});

	it('reads the first header value when x-forwarded-for is repeated', () => {
		process.env.HTTP_FORWARDED_COUNT = '1';

		expect(getClientAddress(makeRequest(['1.1.1.1, 2.2.2.2', '3.3.3.3']))).toBe('2.2.2.2');
	});
});
