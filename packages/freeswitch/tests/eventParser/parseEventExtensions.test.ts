import { describe, expect, it } from '@jest/globals';
import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { parseEventExtensions } from '../../src/eventParser/parseEventExtensions';

describe('parseEventExtensions', () => {
	const createTestEvent = (
		overrides: Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'>,
	): Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'> => ({
		...overrides,
	});

	it('should parse call extensions', () => {
		const event = createTestEvent({
			channelUniqueId: 'channel-123',
			eventName: 'CHANNEL_CREATE',
			sequence: 1,
			firedAt: new Date(),
			receivedAt: new Date(),
			callUniqueId: 'call-123',
			channelName: 'sofia/internal/1001@192.168.1.100',
			channelState: 'CS_INIT',
			channelCallState: 'DOWN',
			channelStateNumber: '1',
			channelCallStateNumber: '1',
			callDirection: 'outbound',
			channelHitDialplan: 'true',
			answerState: 'early',
			hangupCause: 'NORMAL_CLEARING',
			bridgeUniqueIds: ['bridge-1', 'bridge-2'],
			bridgedTo: 'bridge-1',
			legs: {
				'channel-123': {
					legName: 'Caller-Leg',
					uniqueId: 'channel-123',
					direction: 'outbound',
					logicalDirection: 'outbound',
					username: '1001',
					callerName: 'John Doe',
					callerNumber: '1001',
					networkAddress: '192.168.1.100',
					destinationNumber: '1002',
					source: 'mod_sofia',
					context: 'default',
					channelName: 'sofia/internal/1001@192.168.1.100',
					raw: {},
				},
			},
			metadata: {},
			raw: {},
		});

		const result = parseEventExtensions(event);

		expect(result).toBeDefined();
		expect(result?.caller).toBe('1001');
		expect(result?.callee).toBe('1002');
	});

	it('should handle contact names', () => {
		const event = createTestEvent({
			channelUniqueId: 'channel-123',
			eventName: 'CHANNEL_CREATE',
			sequence: 1,
			firedAt: new Date(),
			receivedAt: new Date(),
			callUniqueId: 'call-123',
			channelName: 'sofia/internal/1001@192.168.1.100',
			channelState: 'CS_INIT',
			channelCallState: 'DOWN',
			channelStateNumber: '1',
			channelCallStateNumber: '1',
			callDirection: 'outbound',
			channelHitDialplan: 'true',
			answerState: 'early',
			hangupCause: 'NORMAL_CLEARING',
			bridgeUniqueIds: ['bridge-1', 'bridge-2'],
			bridgedTo: 'bridge-1',
			legs: {
				'channel-123': {
					legName: 'Caller-Leg',
					uniqueId: 'channel-123',
					direction: 'outbound',
					logicalDirection: 'outbound',
					username: '1001',
					callerName: 'John Doe',
					callerNumber: '1001',
					networkAddress: '192.168.1.100',
					destinationNumber: '1002-userid-random@something',
					source: 'mod_sofia',
					context: 'default',
					channelName: 'sofia/internal/1001@192.168.1.100',
					raw: {},
				},
			},
			metadata: {},
			raw: {},
		});

		const result = parseEventExtensions(event);

		expect(result).toBeDefined();
		expect(result?.caller).toBe('1001');
		expect(result?.callee).toBe('1002');
	});

	it('should handle missing variables', () => {
		const event = createTestEvent({
			channelUniqueId: 'channel-123',
			eventName: 'CHANNEL_CREATE',
			sequence: 1,
			firedAt: new Date(),
			receivedAt: new Date(),
			callUniqueId: 'call-123',
			channelName: 'sofia/internal/1001@192.168.1.100',
			channelState: 'CS_INIT',
			channelCallState: 'DOWN',
			channelStateNumber: '1',
			channelCallStateNumber: '1',
			callDirection: 'outbound',
			channelHitDialplan: 'true',
			answerState: 'early',
			hangupCause: 'NORMAL_CLEARING',
			bridgeUniqueIds: ['bridge-1', 'bridge-2'],
			bridgedTo: 'bridge-1',
			legs: {
				'channel-123': {
					legName: 'Caller-Leg',
					uniqueId: 'channel-123',
					direction: 'outbound',
					logicalDirection: 'outbound',
					username: '1001',
					callerName: 'John Doe',
					callerNumber: '1001',
					networkAddress: '192.168.1.100',
					destinationNumber: '1002',
					source: 'mod_sofia',
					context: 'default',
					channelName: 'sofia/internal/1001@192.168.1.100',
					raw: {},
				},
			},
			metadata: {},
			raw: {},
			variables: {},
		});

		const result = parseEventExtensions(event);

		expect(result).toBeDefined();
		expect(result?.caller).toBe('1001');
		expect(result?.callee).toBe('1002');
	});

	it('should handle missing legs', () => {
		const legs: any = undefined;

		const event = createTestEvent({
			channelUniqueId: 'channel-123',
			eventName: 'CHANNEL_CREATE',
			sequence: 1,
			firedAt: new Date(),
			receivedAt: new Date(),
			callUniqueId: 'call-123',
			channelName: 'sofia/internal/1001@192.168.1.100',
			channelState: 'CS_INIT',
			channelCallState: 'DOWN',
			channelStateNumber: '1',
			channelCallStateNumber: '1',
			callDirection: 'outbound',
			channelHitDialplan: 'true',
			answerState: 'early',
			hangupCause: 'NORMAL_CLEARING',
			bridgeUniqueIds: ['bridge-1', 'bridge-2'],
			bridgedTo: 'bridge-1',
			legs,
			metadata: {},
			raw: {},
		});

		const result = parseEventExtensions(event);

		expect(result).toBeDefined();
		expect(result?.caller).toBeUndefined();
		expect(result?.callee).toBeUndefined();
	});

	it('should handle variables', () => {
		const event = createTestEvent({
			channelUniqueId: 'channel-123',
			eventName: 'CHANNEL_CREATE',
			sequence: 1,
			firedAt: new Date(),
			receivedAt: new Date(),
			callUniqueId: 'call-123',
			channelName: 'sofia/internal/1001@192.168.1.100',
			channelState: 'CS_INIT',
			channelCallState: 'DOWN',
			channelStateNumber: '1',
			channelCallStateNumber: '1',
			callDirection: 'outbound',
			channelHitDialplan: 'true',
			answerState: 'early',
			hangupCause: 'NORMAL_CLEARING',
			bridgeUniqueIds: ['bridge-1', 'bridge-2'],
			bridgedTo: 'bridge-1',
			legs: {},
			metadata: {},
			raw: {},
			variables: {
				dialed_extension: ['1002'],
			},
		});

		const result = parseEventExtensions(event);

		expect(result).toBeDefined();
		expect(result?.caller).toBeUndefined();
		expect(result?.callee).toBe('1002');
	});
});
