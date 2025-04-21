import type { Cancel as SipCancel } from 'sip.js';

import { parseInviteRejectionReasons } from './parseInviteRejectionReasons';

describe('parseInviteRejectionReasons', () => {
	it('should return an empty array when message is undefined', () => {
		expect(parseInviteRejectionReasons(undefined as any)).toEqual([]);
	});

	it('should return an empty array when headers are not defined', () => {
		const message: SipCancel = { request: {} } as any;
		expect(parseInviteRejectionReasons(message)).toEqual([]);
	});

	it('should return an empty array when Reason header is not defined', () => {
		const message: SipCancel = { request: { headers: {} } } as any;
		expect(parseInviteRejectionReasons(message)).toEqual([]);
	});

	it('should parse a single text reason correctly', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [{ raw: 'text="Busy Here"' }],
				},
			},
		} as any;

		expect(parseInviteRejectionReasons(message)).toEqual(['Busy Here']);
	});

	it('should extract cause from Reason header if text is not present', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [{ raw: 'SIP ;cause=404' }],
				},
			},
		} as any;

		expect(parseInviteRejectionReasons(message)).toEqual(['404']);
	});

	it('should extract text from Reason header when both text and cause are present ', () => {
		const message: SipCancel = {
			request: {
				headers: { Reason: [{ raw: 'SIP ;cause=200 ;text="OK"' }] },
			},
		} as any;
		expect(parseInviteRejectionReasons(message)).toEqual(['OK']);
	});

	it('should return the raw reason if no matching text or cause is found', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [{ raw: 'code=486' }],
				},
			},
		} as any;

		expect(parseInviteRejectionReasons(message)).toEqual(['code=486']);
	});

	it('should parse multiple reasons and return only the text parts', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [{ raw: 'text="Busy Here"' }, { raw: 'text="Server Internal Error"' }],
				},
			},
		} as any;

		expect(parseInviteRejectionReasons(message)).toEqual(['Busy Here', 'Server Internal Error']);
	});

	it('should return an array of parsed reasons when valid reasons are present', () => {
		const mockMessage: SipCancel = {
			request: {
				headers: {
					Reason: [{ raw: 'SIP ;cause=200 ;text="Call completed elsewhere"' }, { raw: 'SIP ;cause=486 ;text="Busy Here"' }],
				},
			},
		} as any;

		const result = parseInviteRejectionReasons(mockMessage);
		expect(result).toEqual(['Call completed elsewhere', 'Busy Here']);
	});

	it('should parse multiple reasons and return the mixed text, cause and raw items, on this order', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [{ raw: 'text="Busy Here"' }, { raw: 'code=503' }, { raw: 'cause=488' }, { raw: 'text="Forbidden"' }],
				},
			},
		} as any;

		expect(parseInviteRejectionReasons(message)).toEqual(['Busy Here', 'Forbidden', '488', 'code=503']);
	});

	it('should filter out any undefined or null values from the resulting array', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [
						{ raw: 'SIP ;cause=500 ;text="Server Error"' },
						{ raw: null as unknown as string }, // Simulate an edge case { raw: '' }
					],
				},
			},
		} as any;
		expect(parseInviteRejectionReasons(message)).toEqual(['Server Error']);
	});

	it('should handle non-string raw values gracefully and return only valid matches', () => {
		const message: SipCancel = {
			request: {
				headers: {
					Reason: [
						{ raw: 'text="Service Unavailable"' },
						{ raw: { notAString: true } as unknown as string }, // Intentional type misuse for testing
						{ raw: 'code=486' },
					],
				},
			},
		} as any;

		expect(parseInviteRejectionReasons(message)).toEqual(['Service Unavailable', 'code=486']);
	});

	it('should return an empty array when exceptions are thrown', () => {
		// Mock the function to throw an error
		const faultyMessage: SipCancel = {
			request: {
				headers: {
					Reason: [
						{
							raw: () => {
								throw new Error('unexpected error');
							},
						},
					] as any,
				},
			},
		} as any;
		expect(parseInviteRejectionReasons(faultyMessage)).toEqual([]);
	});
});
