import { getCalleeNameFromResponse } from './getCalleeNameFromResponse';

const response = (headers: Record<string, string>) => ({
	has: (name: string) => name in headers,
	get: (name: string) => headers[name],
});

describe('getCalleeNameFromResponse', () => {
	it('reads the name from the X-Mxone-Endpoint header', () => {
		const res = response({
			'x-mxone-endpoint': '"Onur Test2"<sip:+4921158662556@10.224.118.95;user=phone>;privacy=off;private_privacy=private_off',
		});

		expect(getCalleeNameFromResponse(res)).toBe('Onur Test2');
	});

	it('reads the name from the P-Asserted-Identity header', () => {
		expect(getCalleeNameFromResponse(response({ 'p-asserted-identity': '"Alice Smith" <sip:1234@pbx.example.com>' }))).toBe('Alice Smith');
	});

	it('prefers P-Asserted-Identity over the vendor header', () => {
		const res = response({
			'p-asserted-identity': '"Alice" <sip:1234@pbx.example.com>',
			'x-mxone-endpoint': '"Bob"<sip:1234@pbx.example.com>',
		});

		expect(getCalleeNameFromResponse(res)).toBe('Alice');
	});

	it('skips headers without a name', () => {
		const res = response({
			'p-asserted-identity': '<sip:1234@pbx.example.com>',
			'remote-party-id': '"Carol" <sip:1234@pbx.example.com>;party=called',
		});

		expect(getCalleeNameFromResponse(res)).toBe('Carol');
	});

	it('returns null when no identity header is present', () => {
		expect(getCalleeNameFromResponse(response({}))).toBeNull();
	});
});
