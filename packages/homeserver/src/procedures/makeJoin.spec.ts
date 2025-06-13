import { expect, it, describe, mock } from 'bun:test';
import { makeJoinEventBuilder } from './makeJoin';
import { IncompatibleRoomVersionError, NotFoundError } from '../errors';
import type { EventStore } from '../models/event.model';
import type {
	AuthEvents,
	RoomMemberEvent,
} from '../core/events/m.room.member';

interface MakeJoinResult {
	event: RoomMemberEvent;
	room_version: string;
}

describe('makeJoinEventBuilder', () => {
	const mockRoomId = '!roomId:example.org';
	const mockUserId = '@user:example.org';
	const mockOrigin = 'example.org';
	const mockDate = 1620000000000;
	Date.now = () => mockDate;

	const mockGetLastEvent = mock(
		(roomId: string): Promise<EventStore | null> => {
			return Promise.resolve({
				_id: 'lastEventId',
				event: {
					depth: 10,
					room_id: roomId,
					sender: '@otheruser:example.org',
					type: 'm.room.message',
					origin: 'example.org',
					origin_server_ts: 1600000000000,
					prev_events: [],
					auth_events: [],
				},
			});
		},
	);

	const mockGetAuthEvents = mock((): Promise<AuthEvents> => {
		return Promise.resolve({
			'm.room.create': 'createEventId',
			'm.room.power_levels': 'powerLevelsEventId',
			'm.room.join_rules': 'joinRulesEventId',
		});
	});

	it('should throw IncompatibleRoomVersionError when room version is not supported', async () => {
		const makeJoin = makeJoinEventBuilder(mockGetLastEvent, mockGetAuthEvents);

		await expect(
			makeJoin(mockRoomId, mockUserId, ['1', '2', '9'], mockOrigin),
		).rejects.toEqual(
			new IncompatibleRoomVersionError(
				'Your homeserver does not support the features required to join this room',
				{ roomVersion: '10' },
			),
		);
	});

	it('should throw NotFoundError when no events found for room', async () => {
		const mockEmptyGetLastEvent = mock(
			(_: string): Promise<EventStore | null> => Promise.resolve(null),
		);
		const makeJoin = makeJoinEventBuilder(
			mockEmptyGetLastEvent,
			mockGetAuthEvents,
		);

		await expect(
			makeJoin(mockRoomId, mockUserId, ['10'], mockOrigin),
		).rejects.toEqual(
			new NotFoundError(`No events found for room ${mockRoomId}`),
		);
	});

	it('should throw NotFoundError when no create event found for room', async () => {
		const mockEmptyGetAuthEvents = mock(
			(_: string): Promise<AuthEvents> => Promise.resolve({} as AuthEvents),
		);
		const makeJoin = makeJoinEventBuilder(
			mockGetLastEvent,
			mockEmptyGetAuthEvents,
		);

		await expect(
			makeJoin(mockRoomId, mockUserId, ['10'], mockOrigin),
		).rejects.toEqual(
			new NotFoundError(`No create event found for room ${mockRoomId}`),
		);
	});

	it('should create a valid join event', async () => {
		const makeJoin = makeJoinEventBuilder(mockGetLastEvent, mockGetAuthEvents);

		const result = await makeJoin(
			mockRoomId,
			mockUserId,
			['10', '11'],
			mockOrigin,
		);

		expect(result).toEqual({
			event: {
				type: 'm.room.member',
				content: { membership: 'join' },
				room_id: mockRoomId,
				sender: mockUserId,
				state_key: mockUserId,
				auth_events: [
					'createEventId',
					'powerLevelsEventId',
					'joinRulesEventId',
				],
				prev_events: ['lastEventId'],
				depth: 11,
				origin: mockOrigin,
				origin_server_ts: mockDate,
				unsigned: { age_ts: mockDate },
			},
			room_version: '10',
		} as MakeJoinResult);

		expect(mockGetLastEvent).toHaveBeenCalledWith(mockRoomId);
		expect(mockGetAuthEvents).toHaveBeenCalledWith(mockRoomId);
	});

	it('should work with multiple room versions', async () => {
		const makeJoin = makeJoinEventBuilder(mockGetLastEvent, mockGetAuthEvents);

		const result = await makeJoin(
			mockRoomId,
			mockUserId,
			['9', '10', '11'],
			mockOrigin,
		);

		expect(result.room_version).toEqual('10');
	});
});
