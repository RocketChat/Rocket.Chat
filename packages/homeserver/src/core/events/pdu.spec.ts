import { describe, expect, it } from 'bun:test';
import type { EventBase } from './eventBase';
import {
	type FederationEventResponse,
	type MatrixPDU,
	isFederationEventWithPDUs,
} from './pdu';

describe('PDU', () => {
	const samplePDU: MatrixPDU = {
		room_id: '!roomId:example.org',
		sender: '@user:example.org',
		origin: 'example.org',
		origin_server_ts: 1620000000000,
		type: 'm.room.message',
		content: {
			body: 'Hello World',
			msgtype: 'm.text',
		},
		depth: 10,
		prev_events: [],
		auth_events: [],
		event_id: '$event1:example.org',
	};

	describe('isFederationEventWithPDUs', () => {
		it('should return true for valid federation response with PDUs', () => {
			const response: FederationEventResponse = {
				room_id: '!roomId:example.org',
				sender: '@user:example.org',
				origin: 'example.org',
				origin_server_ts: 1620000000000,
				type: 'm.room.message',
				content: {},
				depth: 1,
				prev_events: [],
				auth_events: [],
				pdus: [samplePDU],
			};

			expect(isFederationEventWithPDUs(response)).toBe(true);
		});

		it('should return false for federation response with empty PDUs array', () => {
			const response: FederationEventResponse = {
				room_id: '!roomId:example.org',
				sender: '@user:example.org',
				origin: 'example.org',
				origin_server_ts: 1620000000000,
				type: 'm.room.message',
				content: {},
				depth: 1,
				prev_events: [],
				auth_events: [],
				pdus: [],
			};

			expect(isFederationEventWithPDUs(response)).toBe(false);
		});

		it('should return false for federation response with no PDUs property', () => {
			const response: EventBase = {
				room_id: '!roomId:example.org',
				sender: '@user:example.org',
				origin: 'example.org',
				origin_server_ts: 1620000000000,
				type: 'm.room.message',
				content: {},
				depth: 1,
				prev_events: [],
				auth_events: [],
			};

			expect(isFederationEventWithPDUs(response)).toBe(false);
		});

		it('should return false for federation response with PDUs not being an array', () => {
			const response = {
				room_id: '!roomId:example.org',
				sender: '@user:example.org',
				origin: 'example.org',
				origin_server_ts: 1620000000000,
				type: 'm.room.message',
				content: {},
				depth: 1,
				prev_events: [],
				auth_events: [],
				pdus: 'not-an-array',
			} as unknown as FederationEventResponse;

			expect(isFederationEventWithPDUs(response)).toBe(false);
		});
	});
});
