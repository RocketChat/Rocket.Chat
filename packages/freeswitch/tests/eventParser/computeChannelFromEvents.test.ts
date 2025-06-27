import { describe, expect, it } from '@jest/globals';
import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { computeChannelFromEvents } from '../../src/eventParser/computeChannelFromEvents';

describe('computeChannelFromEvents', () => {
	const createTestEvent = (overrides: Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'>): IFreeSwitchChannelEvent => ({
		_id: 'event-123',
		_updatedAt: new Date(),
		...overrides,
	});

	it('should compute channel from events', async () => {
		const events = [
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:00.000Z'),
				receivedAt: new Date('2024-02-28T12:00:00.100Z'),
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1001@192.168.1.100',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				callDirection: 'outbound',
				caller: '2001',
				callee: '2002',
				raw: {},
				legs: {
					'Caller-Leg': {
						legName: 'Caller-Leg',
						uniqueId: 'channel-123',
						direction: 'outbound',
						logicalDirection: 'outbound',
						username: '1001',
						channelName: 'sofia/internal/1001@192.168.1.100',
						destinationNumber: '1002',
						raw: {},
						profiles: {
							1: {
								profileIndex: '1',
								channelCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
								profileCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
							},
						},
					},
				},
			}),
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_ANSWER',
				sequence: 2,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:01.000Z'),
				receivedAt: new Date('2024-02-28T12:00:01.100Z'),
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1001@192.168.1.100',
				channelState: 'CS_EXECUTE',
				channelCallState: 'RINGING',
				callDirection: 'outbound',
				channelUsername: '1001',
				raw: {},
				legs: {
					'Caller-Leg': {
						legName: 'Caller-Leg',
						uniqueId: 'channel-123',
						direction: 'outbound',
						logicalDirection: 'outbound',
						username: '1001',
						channelName: 'sofia/internal/1001@192.168.1.100',
						destinationNumber: '1002',
						raw: {},
						profiles: {
							1: {
								profileIndex: '1',
								channelCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
								profileCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
								channelAnsweredTime: new Date('2024-02-28T12:00:01.000Z'),
							},
						},
					},
				},
			}),
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_BRIDGE',
				sequence: 3,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:02.000Z'),
				receivedAt: new Date('2024-02-28T12:00:02.100Z'),
				bridgeUniqueIds: ['channel-123', 'channel-456'],
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1001@192.168.1.100',
				channelState: 'CS_EXECUTE',
				channelCallState: 'ACTIVE',
				raw: {},
				legs: {},
			}),
		];

		const result = await computeChannelFromEvents(events);

		expect(result).toEqual({
			channel: {
				uniqueId: 'channel-123',
				name: 'sofia/internal/1001@192.168.1.100',
				callDirection: 'outbound',
				freeSwitchUser: '1001',
				callers: ['2001'],
				callees: ['2002'],
				bridgedTo: ['channel-456'],
				profiles: [],
				anyMedia: false,
				anyAnswer: false,
				anyBridge: false,
				durationSum: 0,
				totalDuration: 0,
				startedAt: new Date('2024-02-28T12:00:00.000Z'),
				kind: 'internal',
			},
			deltas: [
				{
					eventName: 'CHANNEL_CREATE',
					sequence: 1,
					firedAt: new Date('2024-02-28T12:00:00.000Z'),
					receivedAt: new Date('2024-02-28T12:00:00.100Z'),
					callee: '2002',
					caller: '2001',
					newValues: {
						callUniqueId: 'call-123',
						channelName: 'sofia/internal/1001@192.168.1.100',
						channelState: 'CS_NEW',
						channelCallState: 'DOWN',
						callDirection: 'outbound',
						legs: {
							'Caller-Leg': {
								legName: 'Caller-Leg',
								uniqueId: 'channel-123',
								direction: 'outbound',
								logicalDirection: 'outbound',
								profiles: {
									1: {
										profileIndex: '1',
										channelCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
										profileCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
										caller: '2001',
										callee: '2002',
									},
								},
								username: '1001',
								channelName: 'sofia/internal/1001@192.168.1.100',
								destinationNumber: '1002',
							},
						},
					},
				},
				{
					eventName: 'CHANNEL_ANSWER',
					sequence: 2,
					firedAt: new Date('2024-02-28T12:00:01.000Z'),
					receivedAt: new Date('2024-02-28T12:00:01.100Z'),
					newValues: {
						channelUsername: '1001',
						legs: {
							'Caller-Leg': {
								profiles: {
									1: {
										channelAnsweredTime: new Date('2024-02-28T12:00:01.000Z'),
									},
								},
							},
						},
					},
					modifiedValues: {
						channelState: { oldValue: 'CS_NEW', newValue: 'CS_EXECUTE' },
						channelCallState: { oldValue: 'DOWN', newValue: 'RINGING' },
					},
				},
				{
					eventName: 'CHANNEL_BRIDGE',
					sequence: 3,
					firedAt: new Date('2024-02-28T12:00:02.000Z'),
					receivedAt: new Date('2024-02-28T12:00:02.100Z'),
					newValues: {
						bridgeUniqueIds: ['channel-123', 'channel-456'],
					},
					modifiedValues: {
						channelCallState: { oldValue: 'RINGING', newValue: 'ACTIVE' },
					},
				},
			],
			finalState: {
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_BRIDGE',
				sequence: 3,
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1001@192.168.1.100',
				channelState: 'CS_EXECUTE',
				channelCallState: 'ACTIVE',
				callDirection: 'outbound',
				bridgeUniqueIds: ['channel-123', 'channel-456'],
				legs: {
					'Caller-Leg': {
						legName: 'Caller-Leg',
						uniqueId: 'channel-123',
						direction: 'outbound',
						logicalDirection: 'outbound',
						username: '1001',
						channelName: 'sofia/internal/1001@192.168.1.100',
						destinationNumber: '1002',
						profiles: {
							1: {
								profileIndex: '1',
								channelCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
								profileCreatedTime: new Date('2024-02-28T12:00:00.000Z'),
								channelAnsweredTime: new Date('2024-02-28T12:00:01.000Z'),
								caller: '2001',
								callee: '2002',
							},
						},
					},
				},
				channelUsername: '1001',
			},
		});
	});

	it('should handle missing legs', async () => {
		const events = [
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:00.000Z'),
				receivedAt: new Date('2024-02-28T12:00:00.100Z'),
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1001@192.168.1.100',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				raw: {},
				legs: {},
				bridgedTo: 'channel-456',
			}),
		];

		const result = await computeChannelFromEvents(events);

		expect(result).toEqual({
			channel: {
				uniqueId: 'channel-123',
				name: 'sofia/internal/1001@192.168.1.100',
				callDirection: '',
				callers: [],
				callees: [],
				bridgedTo: ['channel-456'],
				profiles: [],
				anyMedia: false,
				anyAnswer: false,
				anyBridge: false,
				durationSum: 0,
				totalDuration: 0,
				startedAt: new Date('2024-02-28T12:00:00.000Z'),
				kind: 'internal',
			},
			deltas: [
				{
					eventName: 'CHANNEL_CREATE',
					sequence: 1,
					firedAt: new Date('2024-02-28T12:00:00.000Z'),
					receivedAt: new Date('2024-02-28T12:00:00.100Z'),
					newValues: {
						callUniqueId: 'call-123',
						channelName: 'sofia/internal/1001@192.168.1.100',
						channelState: 'CS_NEW',
						channelCallState: 'DOWN',
						bridgedTo: 'channel-456',
					},
				},
			],
			finalState: {
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1001@192.168.1.100',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				bridgedTo: 'channel-456',
			},
		});
	});

	it('should handle missing caller leg', async () => {
		const events = [
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:00.000Z'),
				receivedAt: new Date('2024-02-28T12:00:00.100Z'),
				callUniqueId: 'call-123',
				channelName: '',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				raw: {},
				legs: {
					'Other-Leg': {
						legName: 'Other-Leg',
						uniqueId: 'channel-456',
						direction: 'inbound',
						logicalDirection: 'inbound',
						username: '1002',
						channelName: 'sofia/internal/1002@192.168.1.101',
						destinationNumber: '1001',
					},
				},
			}),
		];

		const result = await computeChannelFromEvents(events);

		expect(result).toEqual({
			channel: {
				uniqueId: 'channel-123',
				callDirection: '',
				callers: [],
				callees: [],
				bridgedTo: [],
				profiles: [],
				anyMedia: false,
				anyAnswer: false,
				anyBridge: false,
				durationSum: 0,
				totalDuration: 0,
				startedAt: new Date('2024-02-28T12:00:00.000Z'),
				kind: 'unknown',
			},
			deltas: [
				{
					eventName: 'CHANNEL_CREATE',
					sequence: 1,
					firedAt: new Date('2024-02-28T12:00:00.000Z'),
					receivedAt: new Date('2024-02-28T12:00:00.100Z'),
					newValues: {
						callUniqueId: 'call-123',
						channelState: 'CS_NEW',
						channelCallState: 'DOWN',
						legs: {
							'Other-Leg': {
								legName: 'Other-Leg',
								uniqueId: 'channel-456',
								direction: 'inbound',
								logicalDirection: 'inbound',
								username: '1002',
								channelName: 'sofia/internal/1002@192.168.1.101',
								destinationNumber: '1001',
							},
						},
					},
				},
			],
			finalState: {
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				callUniqueId: 'call-123',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				legs: {
					'Other-Leg': {
						legName: 'Other-Leg',
						uniqueId: 'channel-456',
						direction: 'inbound',
						logicalDirection: 'inbound',
						username: '1002',
						channelName: 'sofia/internal/1002@192.168.1.101',
						destinationNumber: '1001',
					},
				},
			},
		});
	});

	it('should handle missing call ID', async () => {
		const events = [
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:00.000Z'),
				receivedAt: new Date('2024-02-28T12:00:00.100Z'),
				callUniqueId: '',
				channelName: '',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				raw: {},
				legs: {},
			}),
		];

		const result = await computeChannelFromEvents(events);

		expect(result).toEqual({
			channel: {
				uniqueId: 'channel-123',
				callDirection: '',
				callers: [],
				callees: [],
				bridgedTo: [],
				profiles: [],
				anyMedia: false,
				anyAnswer: false,
				anyBridge: false,
				durationSum: 0,
				totalDuration: 0,
				startedAt: new Date('2024-02-28T12:00:00.000Z'),
				kind: 'unknown',
			},
			deltas: [
				{
					eventName: 'CHANNEL_CREATE',
					sequence: 1,
					firedAt: new Date('2024-02-28T12:00:00.000Z'),
					receivedAt: new Date('2024-02-28T12:00:00.100Z'),
					newValues: { channelState: 'CS_NEW', channelCallState: 'DOWN' },
				},
			],
			finalState: {
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
			},
		});
	});

	it('should handle missing event timestamps', async () => {
		const events = [
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				metadata: {},
				firedAt: new Date('2024-02-28T12:00:00.100Z'),
				receivedAt: new Date('2024-02-28T12:00:00.100Z'),
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1007@host',
				channelUsername: '1007',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				raw: {},
				legs: {},
			}),
		];

		const result = await computeChannelFromEvents(events);

		expect(result).toEqual({
			channel: {
				uniqueId: 'channel-123',
				callDirection: '',
				callers: [],
				callees: [],
				bridgedTo: [],
				profiles: [],
				anyMedia: false,
				anyAnswer: false,
				anyBridge: false,
				durationSum: 0,
				totalDuration: 0,
				startedAt: new Date('2024-02-28T12:00:00.100Z'),
				kind: 'internal',
				name: 'sofia/internal/1007@host',
				freeSwitchUser: '1007',
			},
			deltas: [
				{
					eventName: 'CHANNEL_CREATE',
					sequence: 1,
					firedAt: new Date('2024-02-28T12:00:00.100Z'),
					receivedAt: new Date('2024-02-28T12:00:00.100Z'),
					newValues: {
						callUniqueId: 'call-123',
						channelState: 'CS_NEW',
						channelCallState: 'DOWN',
						channelName: 'sofia/internal/1007@host',
						channelUsername: '1007',
					},
				},
			],
			finalState: {
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				callUniqueId: 'call-123',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				channelName: 'sofia/internal/1007@host',
				channelUsername: '1007',
			},
		});
	});

	it('validate fallbacks for unlikely scenarios', async () => {
		// Force missing
		const firedAt = undefined as unknown as Date;
		const receivedAt = undefined as unknown as Date;

		const events = [
			createTestEvent({
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				metadata: {},
				firedAt,
				receivedAt,
				callUniqueId: 'call-123',
				channelName: 'sofia/internal/1007@host',
				channelUsername: '1007',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				raw: {},
				legs: {},
			}),
		];

		const result = await computeChannelFromEvents(events);

		expect(result).toEqual({
			channel: {
				uniqueId: 'channel-123',
				callDirection: '',
				callers: [],
				callees: [],
				bridgedTo: [],
				profiles: [],
				anyMedia: false,
				anyAnswer: false,
				anyBridge: false,
				durationSum: 0,
				totalDuration: 0,
				kind: 'internal',
				name: 'sofia/internal/1007@host',
				freeSwitchUser: '1007',
			},
			deltas: [
				{
					eventName: 'CHANNEL_CREATE',
					sequence: 1,
					newValues: {
						callUniqueId: 'call-123',
						channelState: 'CS_NEW',
						channelCallState: 'DOWN',
						channelName: 'sofia/internal/1007@host',
						channelUsername: '1007',
					},
				},
			],
			finalState: {
				channelUniqueId: 'channel-123',
				eventName: 'CHANNEL_CREATE',
				sequence: 1,
				callUniqueId: 'call-123',
				channelState: 'CS_NEW',
				channelCallState: 'DOWN',
				channelName: 'sofia/internal/1007@host',
				channelUsername: '1007',
			},
		});
	});

	it('should return undefined for empty events array', async () => {
		const result = await computeChannelFromEvents([]);

		expect(result).toBeUndefined();
	});
});
