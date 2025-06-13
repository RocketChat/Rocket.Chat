import type { EventBase } from '../core/events/eventBase';
import {
	roomMemberEvent,
	type AuthEvents as RoomMemberAuthEvents,
} from '../core/events/m.room.member';
import {
	roomNameEvent,
	type RoomNameAuthEvents,
} from '../core/events/m.room.name';
import {
	isRoomPowerLevelsEvent,
	roomPowerLevelsEvent,
	type RoomPowerLevelsEvent,
} from '../core/events/m.room.power_levels';
import {
	roomTombstoneEvent,
	type RoomTombstoneEvent,
	type TombstoneAuthEvents,
} from '../core/events/m.room.tombstone';
import { createSignedEvent } from '../core/events/utils/createSignedEvent';
import { FederationService } from '../federation-sdk';
import { HttpException, HttpStatus } from '@nestjs/common';
import { injectable } from 'tsyringe';
import { generateId } from '../authentication';
import type { InternalCreateRoomResponse, InternalUpdateRoomNameResponse } from '../dtos';
import { ForbiddenError } from '../errors';
import type { SigningKey } from '../keys';
import type {
	EventStore,
	EventBase as ModelEventBase,
} from '../models/event.model';
import { createRoom } from '../procedures/createRoom';
import { EventRepository } from '../repositories/event.repository';
import { RoomRepository } from '../repositories/room.repository';
import { signEvent, type SignedEvent } from '../signEvent';
import { createLogger } from '../utils/logger';
import { ConfigService } from './config.service';
import { EventService, EventType } from './event.service';

const logger = createLogger('RoomService');

// Utility function to create a random ID for room creation
function createMediaId(length: number) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let result = '';
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters[randomIndex];
	}
	return result;
}

@injectable()
export class RoomService {
	constructor(
		private readonly roomRepository: RoomRepository,
		private readonly eventRepository: EventRepository,
		private readonly eventService: EventService,
		private readonly configService: ConfigService,
		private readonly federationService: FederationService,
	) {}

	private validatePowerLevelChange(
		currentPowerLevelsContent: RoomPowerLevelsEvent['content'],
		senderId: string,
		targetUserId: string,
		newPowerLevel: number,
	): void {
		const senderPower =
			currentPowerLevelsContent.users?.[senderId] ??
			currentPowerLevelsContent.users_default;

		// 1. Check if sender can modify m.room.power_levels event itself
		const requiredLevelToModifyEvent =
			currentPowerLevelsContent.events?.['m.room.power_levels'] ??
			currentPowerLevelsContent.state_default ??
			100;

		if (senderPower < requiredLevelToModifyEvent) {
			logger.warn(
				`Sender ${senderId} (power ${senderPower}) lacks global permission (needs ${requiredLevelToModifyEvent}) to modify power levels event.`,
			);
			throw new HttpException(
				"You don't have permission to change power levels events.",
				HttpStatus.FORBIDDEN,
			);
		}

		// 2. Specific checks when changing another user's power level
		if (senderId !== targetUserId) {
			const targetUserCurrentPower =
				currentPowerLevelsContent.users?.[targetUserId] ??
				currentPowerLevelsContent.users_default;

			// Rule: Cannot set another user's power level higher than one's own.
			if (newPowerLevel > senderPower) {
				logger.warn(
					`Sender ${senderId} (power ${senderPower}) cannot set user ${targetUserId}'s power to ${newPowerLevel} (higher than own).`,
				);
				throw new HttpException(
					"You cannot set another user's power level higher than your own.",
					HttpStatus.FORBIDDEN,
				);
			}

			// Rule: Cannot change power level of a user whose current power is >= sender's power.
			if (targetUserCurrentPower >= senderPower) {
				logger.warn(
					`Sender ${senderId} (power ${senderPower}) cannot change power level of user ${targetUserId} (current power ${targetUserCurrentPower}).`,
				);
				throw new HttpException(
					'You cannot change the power level of a user with equal or greater power than yourself.',
					HttpStatus.FORBIDDEN,
				);
			}
		}
	}

	private validateKickPermission(
		currentPowerLevelsContent: RoomPowerLevelsEvent['content'],
		senderId: string,
		kickedUserId: string,
	): void {
		const senderPower =
			currentPowerLevelsContent.users?.[senderId] ??
			currentPowerLevelsContent.users_default ??
			0;
		const kickedUserPower =
			currentPowerLevelsContent.users?.[kickedUserId] ??
			currentPowerLevelsContent.users_default ??
			0;
		const kickLevel = currentPowerLevelsContent.kick ?? 50; // Default kick level if not specified

		if (senderPower < kickLevel) {
			logger.warn(
				`Sender ${senderId} (power ${senderPower}) does not meet required power level (${kickLevel}) to kick users.`,
			);
			throw new HttpException(
				"You don't have permission to kick users from this room.",
				HttpStatus.FORBIDDEN,
			);
		}

		if (kickedUserPower >= senderPower) {
			logger.warn(
				`Sender ${senderId} (power ${senderPower}) cannot kick user ${kickedUserId} (power ${kickedUserPower}) who has equal or greater power.`,
			);
			throw new HttpException(
				'You cannot kick a user with power greater than or equal to your own.',
				HttpStatus.FORBIDDEN,
			);
		}
	}

	private validateBanPermission(
		currentPowerLevelsContent: RoomPowerLevelsEvent['content'],
		senderId: string,
		bannedUserId: string,
	): void {
		const senderPower =
			currentPowerLevelsContent.users?.[senderId] ??
			currentPowerLevelsContent.users_default ??
			0;
		const bannedUserPower =
			currentPowerLevelsContent.users?.[bannedUserId] ??
			currentPowerLevelsContent.users_default ??
			0;
		const banLevel = currentPowerLevelsContent.ban ?? 50; // Default ban level if not specified

		if (senderPower < banLevel) {
			logger.warn(
				`Sender ${senderId} (power ${senderPower}) does not meet required power level (${banLevel}) to ban users.`,
			);
			throw new HttpException(
				"You don't have permission to ban users from this room.",
				HttpStatus.FORBIDDEN,
			);
		}

		if (bannedUserPower >= senderPower) {
			logger.warn(
				`Sender ${senderId} (power ${senderPower}) cannot ban user ${bannedUserId} (power ${bannedUserPower}) who has equal or greater power.`,
			);
			throw new HttpException(
				'You cannot ban a user with power greater than or equal to your own.',
				HttpStatus.FORBIDDEN,
			);
		}
	}

	async upsertRoom(roomId: string, state: ModelEventBase[]) {
		logger.info(`Upserting room ${roomId} with ${state.length} state events`);

		// Find the create event to determine room version
		const createEvent = state.find((event) => event.type === 'm.room.create');
		if (createEvent) {
			logger.info(`Found create event for room ${roomId}`);
		}

		// Find power levels
		const powerLevelsEvent = state.find(
			(event) => event.type === 'm.room.power_levels',
		);
		if (powerLevelsEvent) {
			logger.info(`Found power levels event for room ${roomId}`);
		}

		// Count member events
		const memberEvents = state.filter(
			(event) => event.type === 'm.room.member',
		);
		logger.info(`Room ${roomId} has ${memberEvents.length} member events`);

		try {
			await this.roomRepository.upsert(roomId, state);
			logger.info(`Successfully upserted room ${roomId}`);
		} catch (error) {
			logger.error(`Failed to upsert room ${roomId}: ${error}`);
			throw error;
		}
	}

	/**
	 * Create a new room with the given sender and username
	 */
	async createRoom(
		username: string,
		sender: string,
		name: string,
		canonicalAlias?: string,
		alias?: string,
	): Promise<InternalCreateRoomResponse> {
		logger.debug(`Creating room for ${sender} with ${username}`);
		const config = this.configService.getServerConfig();
		const signingKey = await this.configService.getSigningKey();

		if (sender.split(':').pop() !== config.name) {
			throw new HttpException('Invalid sender', HttpStatus.BAD_REQUEST);
		}

		const roomId = `!${createMediaId(18)}:${config.name}`;
		const result = await createRoom(
			[sender, username],
			createSignedEvent(
				Array.isArray(signingKey) ? signingKey[0] : signingKey,
				config.name,
			),
			roomId,
		);

		if (result.events.filter(Boolean).length === 0) {
			throw new HttpException(
				'Error creating room',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		for (const eventObj of result.events) {
			await this.eventService.insertEvent(eventObj.event, eventObj._id);
		}

		await this.roomRepository.insert(roomId, { name, canonicalAlias, alias });
		logger.info(`Successfully saved room ${roomId} to rooms collection`);

		return {
			room_id: result.roomId,
			event_id: result.events[0]._id,
		};
	}

	async updateRoomName(
		roomId: string,
		name: string,
		senderId: string,
		targetServer: string,
	): Promise<InternalUpdateRoomNameResponse> {
		logger.info(
			`Updating room name for ${roomId} to \"${name}\" by ${senderId}`,
		);

		const lastEvent: EventStore | null =
			await this.eventService.getLastEventForRoom(roomId);
		if (!lastEvent) {
			throw new HttpException(
				'Room has no history, cannot update name',
				HttpStatus.BAD_REQUEST,
			);
		}

		const authEventIds = await this.eventService.getAuthEventIds(
			EventType.NAME,
			{ roomId, senderId },
		);
		const powerLevelsEventId = authEventIds.find(
			(e) => e.type === EventType.POWER_LEVELS,
		)?._id;

		const canUpdateRoomName = await this.eventService.checkUserPermission(
			powerLevelsEventId || '',
			senderId,
			EventType.NAME,
		);

		if (!canUpdateRoomName) {
			logger.warn(
				`User ${senderId} does not have permission to set room name in ${roomId} based on power levels.`,
			);
			throw new HttpException(
				"You don't have permission to set the room name.",
				HttpStatus.FORBIDDEN,
			);
		}

		if (authEventIds.length < 3) {
			logger.error(
				`Could not find all auth events for room name update. Found: ${JSON.stringify(authEventIds)}`,
			);
			throw new HttpException(
				'Not authorized or missing prerequisites to set room name',
				HttpStatus.FORBIDDEN,
			);
		}

		const authEvents: RoomNameAuthEvents = {
			'm.room.create':
				authEventIds.find((e) => e.type === EventType.CREATE)?._id || '',
			'm.room.power_levels': powerLevelsEventId || '',
			'm.room.member':
				authEventIds.find((e) => e.type === EventType.MEMBER)?._id || '',
		};

		if (!authEvents['m.room.create'] || !authEvents['m.room.member']) {
			// power_levels already checked
			logger.error(
				`Critical auth events missing (create or member). Create: ${authEvents['m.room.create']}, Member: ${authEvents['m.room.member']}`,
			);
			throw new HttpException(
				'Critical auth events missing, cannot set room name',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const roomNameEventPayload = {
			roomId,
			sender: senderId,
			auth_events: authEvents,
			prev_events: [lastEvent._id],
			depth: lastEvent.event.depth + 1,
			content: { name },
			origin: this.configService.getServerConfig().name,
		};

		const signingKeyConfig = await this.configService.getSigningKey();
		const signingKey = Array.isArray(signingKeyConfig)
			? signingKeyConfig[0]
			: signingKeyConfig;
		const serverName = this.configService.getServerConfig().name;

		const unsignedEvent = roomNameEvent(roomNameEventPayload);
		const signedEvent = await signEvent(unsignedEvent, signingKey, serverName);

		const eventId = generateId(signedEvent);
		await this.eventService.insertEvent(signedEvent, eventId);
		logger.info(
			`Successfully created and stored m.room.name event ${eventId} for room ${roomId}`,
		);

		await this.roomRepository.updateRoomName(roomId, name);
		logger.info(
			`Successfully updated room name in repository for room ${roomId}`,
		);

		for (const server of [targetServer]) {
			try {
				await this.federationService.sendEvent(
					server,
					signedEvent as unknown as EventBase,
				);
				logger.info(
					`Successfully sent m.room.name event ${eventId} over federation to ${server} for room ${roomId}`,
				);
			} catch (error) {
				logger.error(
					`Failed to send m.room.name event ${eventId} over federation to ${server}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		return {
			eventId: eventId,
		};
	}

	async updateUserPowerLevel(
		roomId: string,
		userId: string,
		powerLevel: number,
		senderId: string,
		targetServers: string[] = [],
	): Promise<string> {
		logger.info(
			`Updating power level for user ${userId} in room ${roomId} to ${powerLevel} by ${senderId}`,
		);

		const authEventIds = await this.eventService.getAuthEventIds(
			EventType.POWER_LEVELS,
			{ roomId, senderId },
		);
		const currentPowerLevelsEvent =
			await this.eventService.getEventById<RoomPowerLevelsEvent>(
				authEventIds.find((e) => e.type === EventType.POWER_LEVELS)?._id || '',
			);

		if (!currentPowerLevelsEvent) {
			logger.error(`No m.room.power_levels event found for room ${roomId}`);
			throw new HttpException(
				'Room power levels not found, cannot update.',
				HttpStatus.NOT_FOUND,
			);
		}

		this.validatePowerLevelChange(
			currentPowerLevelsEvent.content,
			senderId,
			userId,
			powerLevel,
		);

		const createAuthResult = authEventIds.find(
			(e) => e.type === EventType.CREATE,
		);
		const powerLevelsAuthResult = authEventIds.find(
			(e) => e.type === EventType.POWER_LEVELS,
		);
		const memberAuthResult = authEventIds.find(
			(e) => e.type === EventType.MEMBER && e.state_key === senderId,
		);

		const authEventsMap = {
			'm.room.create': createAuthResult?._id || '',
			'm.room.power_levels': powerLevelsAuthResult?._id || '',
			'm.room.member': memberAuthResult?._id || '',
		};

		// Ensure critical auth events were found
		if (
			!authEventsMap['m.room.create'] ||
			!authEventsMap['m.room.power_levels'] ||
			!authEventsMap['m.room.member']
		) {
			logger.error(
				`Critical auth events missing for power level update. Create: ${authEventsMap['m.room.create']}, PowerLevels: ${authEventsMap['m.room.power_levels']}, Member: ${authEventsMap['m.room.member']}`,
			);
			throw new HttpException(
				'Internal server error: Missing auth events for power level update.',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const lastEventStore = await this.eventService.getLastEventForRoom(roomId);
		if (!lastEventStore) {
			logger.error(`No last event found for room ${roomId}`);
			throw new HttpException(
				'Room has no history, cannot update power levels',
				HttpStatus.BAD_REQUEST,
			);
		}

		const serverName = this.configService.getServerConfig().name;
		if (!serverName) {
			logger.error('Server name is not configured. Cannot set event origin.');
			throw new HttpException(
				'Server configuration error for event origin.',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const eventToSign = roomPowerLevelsEvent({
			roomId,
			members: [senderId, userId],
			auth_events: Object.values(authEventsMap).filter(
				(id) => typeof id === 'string',
			),
			prev_events: [lastEventStore.event.event_id!],
			depth: lastEventStore.event.depth + 1,
			content: {
				...currentPowerLevelsEvent.content,
				users: {
					...(currentPowerLevelsEvent.content.users || {}),
					[userId]: powerLevel,
				},
			},
			ts: Date.now(),
		});

		const signingKeyConfig = await this.configService.getSigningKey();
		const signingKey: SigningKey = Array.isArray(signingKeyConfig)
			? signingKeyConfig[0]
			: signingKeyConfig;

		const signedEvent: SignedEvent<RoomPowerLevelsEvent> = await signEvent(
			eventToSign,
			signingKey,
			serverName,
		);

		const eventId = generateId(signedEvent);

		// Store the event locally BEFORE attempting federation
		await this.eventService.insertEvent(signedEvent, eventId);
		logger.info(
			`Successfully created and stored m.room.power_levels event ${eventId} for room ${roomId}`,
		);

		for (const server of targetServers) {
			if (server === this.configService.getServerConfig().name) {
				continue;
			}

			try {
				await this.federationService.sendEvent(server, signedEvent);
				logger.info(
					`Successfully sent m.room.power_levels event ${eventId} over federation to ${server} for room ${roomId}`,
				);
			} catch (error) {
				logger.error(
					`Failed to send m.room.power_levels event ${eventId} over federation to ${server}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		return eventId;
	}

	async leaveRoom(
		roomId: string,
		senderId: string,
		targetServers: string[] = [],
	): Promise<string> {
		logger.info(`User ${senderId} leaving room ${roomId}`);

		const lastEvent = await this.eventService.getLastEventForRoom(roomId);
		if (!lastEvent) {
			throw new HttpException(
				'Room has no history, cannot leave',
				HttpStatus.BAD_REQUEST,
			);
		}

		const authEventIds = await this.eventService.getAuthEventIds(
			EventType.MEMBER,
			{ roomId, senderId },
		);

		// For a leave event, the user must have permission to send m.room.member events.
		// This is typically covered by them being a member, but power levels might restrict it.
		const powerLevelsEventId = authEventIds.find(
			(e) => e.type === EventType.POWER_LEVELS,
		)?._id;
		if (!powerLevelsEventId) {
			logger.warn(
				`No power_levels event found for room ${roomId}, cannot verify permission to leave.`,
			);
			throw new HttpException(
				'Cannot verify permission to leave room.',
				HttpStatus.FORBIDDEN,
			);
		}

		const canLeaveRoom = await this.eventService.checkUserPermission(
			powerLevelsEventId,
			senderId,
			EventType.MEMBER,
		);

		if (!canLeaveRoom) {
			logger.warn(
				`User ${senderId} does not have permission to send m.room.member events in ${roomId} (i.e., to leave).`,
			);
			throw new HttpException(
				"You don't have permission to leave this room.",
				HttpStatus.FORBIDDEN,
			);
		}

		const createEventId = authEventIds.find(
			(e) => e.type === EventType.CREATE,
		)?._id;
		const memberEventId = authEventIds.find(
			(e) => e.type === EventType.MEMBER && e.state_key === senderId,
		)?._id;

		if (!createEventId || !memberEventId) {
			logger.error(
				`Critical auth events missing for leave. Create: ${createEventId}, Member: ${memberEventId}`,
			);
			throw new HttpException(
				'Critical auth events missing, cannot leave room',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const authEvents: RoomMemberAuthEvents = {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			[`m.room.member:${senderId}`]: memberEventId,
		};

		const serverName = this.configService.getServerConfig().name;
		const signingKeyConfig = await this.configService.getSigningKey();
		const signingKey: SigningKey = Array.isArray(signingKeyConfig)
			? signingKeyConfig[0]
			: signingKeyConfig;

		const unsignedEvent = roomMemberEvent({
			roomId,
			sender: senderId,
			state_key: senderId,
			auth_events: authEvents,
			prev_events: [lastEvent._id],
			depth: lastEvent.event.depth + 1,
			membership: 'leave',
			origin: serverName,
			content: {
				membership: 'leave',
			},
		});

		const signedEvent = await signEvent(unsignedEvent, signingKey, serverName);
		const eventId = generateId(signedEvent);

		// After leaving, update local room membership state if necessary (e.g., remove from active members list)
		// This might be handled by whatever consumes these events, or could be an explicit step here.
		// For now, we assume event persistence is the primary concern of this service method.

		for (const server of targetServers) {
			if (server === serverName) {
				continue;
			}

			try {
				await this.federationService.sendEvent(server, signedEvent);
				logger.info(
					`Successfully sent m.room.member (leave) event ${eventId} over federation to ${server} for room ${roomId}`,
				);
			} catch (error) {
				logger.error(
					`Failed to send m.room.member (leave) event ${eventId} over federation to ${server}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		await this.eventService.insertEvent(signedEvent, eventId);
		logger.info(
			`Successfully created and stored m.room.member (leave) event ${eventId} for user ${senderId} in room ${roomId}`,
		);

		return eventId;
	}

	async kickUser(
		roomId: string,
		kickedUserId: string,
		senderId: string,
		reason?: string,
		targetServers: string[] = [],
	): Promise<string> {
		logger.info(
			`User ${senderId} kicking user ${kickedUserId} from room ${roomId}. Reason: ${reason || 'No reason specified'}`,
		);

		// TODO: Check if both sender and kicked user are members of the room
		// This will be easier when we have a room state cache

		const lastEvent = await this.eventService.getLastEventForRoom(roomId);
		if (!lastEvent) {
			throw new HttpException(
				'Room has no history, cannot kick user',
				HttpStatus.BAD_REQUEST,
			);
		}

		const authEventIdsForPowerLevels = await this.eventService.getAuthEventIds(
			EventType.POWER_LEVELS,
			{ roomId, senderId },
		);
		const powerLevelsEventId = authEventIdsForPowerLevels.find(
			(e) => e.type === EventType.POWER_LEVELS,
		)?._id;

		if (!powerLevelsEventId) {
			logger.warn(
				`No power_levels event found for room ${roomId}, cannot verify permission to kick.`,
			);
			throw new HttpException(
				'Cannot verify permission to kick user.',
				HttpStatus.FORBIDDEN,
			);
		}
		const powerLevelsEvent =
			await this.eventService.getEventById<RoomPowerLevelsEvent>(
				powerLevelsEventId,
			);
		if (!powerLevelsEvent) {
			logger.error(
				`Power levels event ${powerLevelsEventId} not found despite ID being retrieved.`,
			);
			throw new HttpException(
				'Internal server error: Power levels event data missing.',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		this.validateKickPermission(
			powerLevelsEvent.content,
			senderId,
			kickedUserId,
		);

		const authEventIdsForMemberEvent = await this.eventService.getAuthEventIds(
			EventType.MEMBER,
			{ roomId, senderId },
		);
		const createEventId = authEventIdsForMemberEvent.find(
			(e) => e.type === EventType.CREATE,
		)?._id;
		const senderMemberEventId = authEventIdsForMemberEvent.find(
			(e) => e.type === EventType.MEMBER && e.state_key === senderId,
		)?._id;

		if (!createEventId || !senderMemberEventId || !powerLevelsEventId) {
			logger.error(
				`Critical auth events missing for kick. Create: ${createEventId}, Sender's Member: ${senderMemberEventId}, PowerLevels: ${powerLevelsEventId}`,
			);
			throw new HttpException(
				'Critical auth events missing, cannot kick user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const authEvents: RoomMemberAuthEvents = {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			[`m.room.member:${kickedUserId}`]: senderMemberEventId,
		};

		const serverName = this.configService.getServerConfig().name;
		const signingKeyConfig = await this.configService.getSigningKey();
		const signingKey: SigningKey = Array.isArray(signingKeyConfig)
			? signingKeyConfig[0]
			: signingKeyConfig;

		const unsignedEvent = roomMemberEvent({
			roomId,
			sender: senderId,
			state_key: kickedUserId,
			auth_events: authEvents,
			prev_events: [lastEvent._id],
			depth: lastEvent.event.depth + 1,
			membership: 'leave',
			origin: serverName,
			content: {
				membership: 'leave',
				...(reason ? { reason } : {}),
			},
		});

		const signedEvent = await signEvent(unsignedEvent, signingKey, serverName);
		const eventId = generateId(signedEvent);

		await this.eventService.insertEvent(signedEvent, eventId);
		logger.info(
			`Successfully created and stored m.room.member (kick) event ${eventId} for user ${kickedUserId} in room ${roomId}`,
		);

		for (const server of targetServers) {
			if (server === serverName) {
				continue;
			}
			try {
				await this.federationService.sendEvent(server, signedEvent);
				logger.info(
					`Successfully sent m.room.member (kick) event ${eventId} over federation to ${server} for room ${roomId}`,
				);
			} catch (error) {
				logger.error(
					`Failed to send m.room.member (kick) event ${eventId} over federation to ${server}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
		return eventId;
	}

	async banUser(
		roomId: string,
		bannedUserId: string,
		senderId: string,
		reason?: string,
		targetServers: string[] = [],
	): Promise<string> {
		logger.info(
			`User ${senderId} banning user ${bannedUserId} from room ${roomId}. Reason: ${reason || 'No reason specified'}`,
		);

		const lastEvent = await this.eventService.getLastEventForRoom(roomId);
		if (!lastEvent) {
			throw new HttpException(
				'Room has no history, cannot ban user',
				HttpStatus.BAD_REQUEST,
			);
		}

		const authEventIdsForPowerLevels = await this.eventService.getAuthEventIds(
			EventType.POWER_LEVELS,
			{ roomId, senderId },
		);
		const powerLevelsEventId = authEventIdsForPowerLevels.find(
			(e) => e.type === EventType.POWER_LEVELS,
		)?._id;

		if (!powerLevelsEventId) {
			logger.warn(
				`No power_levels event found for room ${roomId}, cannot verify permission to ban.`,
			);
			throw new HttpException(
				'Cannot verify permission to ban user.',
				HttpStatus.FORBIDDEN,
			);
		}
		const powerLevelsEvent =
			await this.eventService.getEventById<RoomPowerLevelsEvent>(
				powerLevelsEventId,
			);
		if (!powerLevelsEvent) {
			logger.error(
				`Power levels event ${powerLevelsEventId} not found despite ID being retrieved.`,
			);
			throw new HttpException(
				'Internal server error: Power levels event data missing.',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		this.validateBanPermission(
			powerLevelsEvent.content,
			senderId,
			bannedUserId,
		);

		const authEventIdsForMemberEvent = await this.eventService.getAuthEventIds(
			EventType.MEMBER,
			{ roomId, senderId },
		);
		const createEventId = authEventIdsForMemberEvent.find(
			(e) => e.type === EventType.CREATE,
		)?._id;
		const senderMemberEventId = authEventIdsForMemberEvent.find(
			(e) => e.type === EventType.MEMBER && e.state_key === senderId,
		)?._id;

		if (!createEventId || !senderMemberEventId || !powerLevelsEventId) {
			logger.error(
				`Critical auth events missing for ban. Create: ${createEventId}, Sender's Member: ${senderMemberEventId}, PowerLevels: ${powerLevelsEventId}`,
			);
			throw new HttpException(
				'Critical auth events missing, cannot ban user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const authEvents: RoomMemberAuthEvents = {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			[`m.room.member:${bannedUserId}`]: senderMemberEventId,
		};

		const serverName = this.configService.getServerConfig().name;
		const signingKeyConfig = await this.configService.getSigningKey();
		const signingKey: SigningKey = Array.isArray(signingKeyConfig)
			? signingKeyConfig[0]
			: signingKeyConfig;

		const unsignedEvent = roomMemberEvent({
			roomId,
			sender: senderId,
			state_key: bannedUserId,
			auth_events: authEvents,
			prev_events: [lastEvent._id],
			depth: lastEvent.event.depth + 1,
			membership: 'ban',
			origin: serverName,
			content: {
				membership: 'ban',
				...(reason ? { reason } : {}),
			},
		});

		const signedEvent = await signEvent(unsignedEvent, signingKey, serverName);
		const eventId = generateId(signedEvent);

		await this.eventService.insertEvent(signedEvent, eventId);
		logger.info(
			`Successfully created and stored m.room.member (ban) event ${eventId} for user ${bannedUserId} in room ${roomId}`,
		);

		for (const server of targetServers) {
			if (server === serverName) {
				continue;
			}
			try {
				await this.federationService.sendEvent(server, signedEvent);
				logger.info(
					`Successfully sent m.room.member (ban) event ${eventId} over federation to ${server} for room ${roomId}`,
				);
			} catch (error) {
				logger.error(
					`Failed to send m.room.member (ban) event ${eventId} over federation to ${server}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
		return eventId;
	}

	async markRoomAsTombstone(
		roomId: string,
		sender: string,
		reason = 'This room has been deleted',
		replacementRoomId?: string,
	): Promise<SignedEvent<RoomTombstoneEvent>> {
		logger.debug(`Marking room ${roomId} as tombstone by ${sender}`);
		const config = this.configService.getServerConfig();
		const signingKey = await this.configService.getSigningKey();

		const room = await this.roomRepository.findOneById(roomId);
		if (!room) {
			throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
		}
		const isTombstoned = await this.isRoomTombstoned(roomId);
		if (isTombstoned) {
			logger.warn(`Attempted to delete an already tombstoned room: ${roomId}`);
			throw new ForbiddenError('Cannot delete an already tombstoned room');
		}
		if (sender.split(':').pop() !== config.name) {
			throw new HttpException('Invalid sender', HttpStatus.BAD_REQUEST);
		}

		const powerLevelsEvent =
			await this.eventRepository.findPowerLevelsEventByRoomId(roomId);
		if (!powerLevelsEvent) {
			throw new HttpException(
				'Cannot delete room without power levels',
				HttpStatus.FORBIDDEN,
			);
		}

		if (!isRoomPowerLevelsEvent(powerLevelsEvent.event)) {
			throw new HttpException(
				'Invalid power levels event',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		this.validatePowerLevelForTombstone(powerLevelsEvent.event, sender);

		const authEvents = await this.eventService.getAuthEventIds(
			EventType.MESSAGE,
			{
				roomId,
				senderId: sender,
			},
		);
		const latestEvent = await this.eventService.getLastEventForRoom(roomId);
		const currentDepth = latestEvent?.event?.depth ?? 0;
		const depth = currentDepth + 1;

		const authEventsMap: TombstoneAuthEvents = {
			'm.room.create':
				authEvents.find(
					(event: { type: EventType }) => event.type === EventType.CREATE,
				)?._id || '',
			'm.room.power_levels':
				authEvents.find(
					(event: { type: EventType }) => event.type === EventType.POWER_LEVELS,
				)?._id || '',
			'm.room.member':
				authEvents.find(
					(event: { type: EventType }) => event.type === EventType.MEMBER,
				)?._id || '',
		};
		const prevEvents = latestEvent ? [latestEvent._id] : [];

		const tombstoneEvent = roomTombstoneEvent({
			roomId,
			sender,
			body: reason,
			replacementRoom: replacementRoomId,
			auth_events: authEventsMap,
			prev_events: prevEvents,
			depth,
			origin: config.name,
		});

		const signedEvent = await signEvent(
			tombstoneEvent,
			Array.isArray(signingKey) ? signingKey[0] : signingKey,
			config.name,
		);

		const eventId = await this.eventService.insertEvent(signedEvent);
		await this.roomRepository.markRoomAsDeleted(roomId, eventId);

		await this.notifyFederatedServersAboutTombstone(roomId, signedEvent);
		logger.info(`Successfully marked room ${roomId} as tombstone`);

		return signedEvent;
	}

	public async isRoomTombstoned(roomId: string): Promise<boolean> {
		try {
			const room = await this.roomRepository.findOneById(roomId);
			if (room?.room.deleted) {
				logger.debug(
					`Room ${roomId} is marked as deleted in the room repository`,
				);
				return true;
			}

			const tombstoneEvents = await this.eventService.findEvents(
				{
					'event.room_id': roomId,
					'event.type': 'm.room.tombstone',
					'event.state_key': '',
				},
				{ limit: 1 },
			);

			return tombstoneEvents.length > 0;
		} catch (error) {
			logger.error(`Error checking if room ${roomId} is tombstoned: ${error}`);
			return false;
		}
	}

	private validatePowerLevelForTombstone(
		powerLevels: RoomPowerLevelsEvent,
		sender: string,
	): void {
		const userPowerLevel =
			powerLevels.content.users?.[sender] ??
			powerLevels.content.users_default ??
			0;
		const requiredPowerLevel = powerLevels.content.state_default ?? 50;

		if (userPowerLevel < requiredPowerLevel) {
			throw new HttpException(
				'Insufficient power level to delete room',
				HttpStatus.FORBIDDEN,
			);
		}
	}

	private async notifyFederatedServersAboutTombstone(
		roomId: string,
		signedEvent: SignedEvent<RoomTombstoneEvent>,
	): Promise<void> {
		const config = this.configService.getServerConfig();
		const memberEvents =
			await this.eventRepository.findAllJoinedMembersEventsByRoomId(roomId);
		const remoteServers = new Set<string>();

		for (const event of memberEvents) {
			if (event.event.state_key) {
				const serverName = event.event.state_key.split(':').pop();
				if (serverName && serverName !== config.name) {
					remoteServers.add(serverName);
				}
			}
		}

		const federationPromises = Array.from(remoteServers).map((server) => {
			logger.debug(
				`Sending tombstone event to server ${server} for room ${roomId}`,
			);
			return this.federationService.sendTombstone(server, signedEvent);
		});

		await Promise.all(federationPromises);
		logger.info(
			`Notified ${remoteServers.size} federated servers about room mark as tombstone`,
		);
	}
}
