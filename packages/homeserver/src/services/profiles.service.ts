import { makeJoinEventBuilder } from '../procedures/makeJoin';
import { ConfigService } from './config.service';
import { EventService } from './event.service';

import type {
	AuthEvents
} from '../core/events/m.room.member';
import { injectable } from 'tsyringe';
import type { EventAuthParams, EventAuthResponse, GetDevicesParams, GetDevicesResponse, GetMissingEventsBody, GetMissingEventsParams, GetMissingEventsResponse, MakeJoinParams, MakeJoinQuery, MakeJoinResponse, QueryKeysBody, QueryKeysResponse, QueryProfileResponse } from '../dtos/federation/profiles.dto';
import type { EventStore } from '../models/event.model';
import { EventRepository } from '../repositories/event.repository';

@injectable()
export class ProfilesService {
	constructor(
		private readonly configService: ConfigService,
		private readonly eventService: EventService,
		private readonly eventRepository: EventRepository,
	) {}

	async queryProfile(
		userId: string,
	): Promise<QueryProfileResponse> {
		return {
			avatar_url: 'mxc://matrix.org/MyC00lAvatar',
			displayname: userId,
		};
	}

	async queryKeys(deviceKeys: QueryKeysBody['device_keys']): Promise<QueryKeysResponse> {
		const keys = Object.keys(deviceKeys).reduce((v, cur) => {
			v[cur] = 'unknown_key';
			return v;
		}, {} as QueryKeysResponse['device_keys']);

		return {
			device_keys: keys,
		};
	}

	async getDevices(userId: GetDevicesParams['userId']): Promise<GetDevicesResponse> {
		return {
			user_id: userId,
			stream_id: 1,
			devices: [],
		};
	}

	async makeJoin(
		roomId: MakeJoinParams['roomId'],
		userId: MakeJoinParams['userId'],
		version: MakeJoinQuery['ver'],
	): Promise<MakeJoinResponse> {
		if (!userId.includes(':') || !userId.includes('@')) {
			throw new Error('Invalid sender');
		}
		if (!roomId.includes(':') || !roomId.includes('!')) {
			throw new Error('Invalid room Id');
		}

		const getAuthEvents = async (roomId: string): Promise<AuthEvents> => {
			const authEvents =
				await this.eventRepository.findAuthEventsIdsByRoomId(roomId);
			const eventsDict = authEvents.reduce(
				(acc: Record<string, string>, event: { event: { type: string; state_key?: string }; _id: string }) => {
					const isMemberEvent =
						event.event.type === 'm.room.member' && event.event.state_key;
					if (isMemberEvent) {
						acc[`m.room.member:${event.event.state_key}`] = event._id;
					} else {
						acc[event.event.type] = event._id;
					}

					return acc;
				},
				{} as Record<string, string>,
			);

			return {
				'm.room.create': eventsDict['m.room.create'],
				'm.room.power_levels': eventsDict['m.room.power_levels'],
				'm.room.join_rules': eventsDict['m.room.join_rules'],
				...(eventsDict[`m.room.member:${userId}`]
					? {
							[`m.room.member:${userId}`]:
								eventsDict[`m.room.member:${userId}`],
						}
					: {}),
			};
		};

		const getLastEvent = async (roomId: string): Promise<EventStore | null> =>
			this.eventService.getLastEventForRoom(roomId);

		const makeJoinEvent = makeJoinEventBuilder(getLastEvent, getAuthEvents);
		const serverName = this.configService.getServerConfig().name;

		const versionArray = version ? version : ['1'];

		return makeJoinEvent(roomId, userId, versionArray, serverName) as unknown as MakeJoinResponse;
	}

	async getMissingEvents(
		roomId: GetMissingEventsParams['roomId'],
		earliestEvents: GetMissingEventsBody['earliest_events'],
		latestEvents: GetMissingEventsBody['latest_events'],
		limit: GetMissingEventsBody['limit'],
	): Promise<GetMissingEventsResponse> {
		return this.eventService.getMissingEvents(
			roomId,
			earliestEvents,
			latestEvents,
			limit,
		);
	}

	async eventAuth(
		_roomId: EventAuthParams['roomId'],
		_eventId: EventAuthParams['eventId'],
	): Promise<EventAuthResponse> {
		return {
			auth_chain: [],
		};
	}
}
