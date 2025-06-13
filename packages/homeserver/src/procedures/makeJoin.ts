import type { AuthEvents } from '../core/events/m.room.member';
import { roomMemberEvent } from '../core/events/m.room.member';
import { IncompatibleRoomVersionError, NotFoundError } from '../errors';
import type { EventStore } from '../models/event.model';

// "method":"GET",
// "url":"http://rc1:443/_matrix/federation/v1/make_join/%21kwkcWPpOXEJvlcollu%3Arc1/%40admin%3Ahs1?ver=1&ver=2&ver=3&ver=4&ver=5&ver=6&ver=7&ver=8&ver=9&ver=10&ver=11&ver=org.matrix.msc3757.10&ver=org.matrix.msc3757.11",

export const makeJoinEventBuilder =
	(
		getLastEvent: (roomId: string) => Promise<EventStore | null>,
		getAuthEvents: (roomId: string) => Promise<AuthEvents>,
	) =>
	async (
		roomId: string,
		userId: string,
		roomVersions: string[],
		origin: string,
	) => {
		if (!roomVersions.includes('10')) {
			throw new IncompatibleRoomVersionError(
				'Your homeserver does not support the features required to join this room',
				{ roomVersion: '10' },
			);
		}
		const lastEvent = await getLastEvent(roomId);

		if (!lastEvent) {
			throw new NotFoundError(`No events found for room ${roomId}`);
		}

		const authEvents = await getAuthEvents(roomId);
		if (authEvents['m.room.create'] === undefined) {
			throw new NotFoundError(`No create event found for room ${roomId}`);
		}

		const event = roomMemberEvent({
			membership: 'join',
			roomId,
			sender: userId,
			state_key: userId,
			auth_events: authEvents,
			prev_events: [lastEvent._id],
			depth: lastEvent.event.depth + 1,
			origin,
			ts: Date.now(),
		});

		return {
			event,
			room_version: '10',
		};
	};
