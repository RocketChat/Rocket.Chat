import { roomMemberEvent } from '../core/events/m.room.member';
import { FederationService } from '../federation-sdk';
import {
	ForbiddenException,
	HttpException,
	HttpStatus
} from '@nestjs/common';
import { injectable } from 'tsyringe';
import { generateId } from '../authentication';
import type { InternalInviteUserResponse, ProcessInviteBody, ProcessInviteResponse } from '../dtos';
import { makeUnsignedRequest } from '../makeRequest';
import type { EventBase } from '../models/event.model';
import { signEvent } from '../signEvent';
import { createLogger } from '../utils/logger';
import { ConfigService } from './config.service';
import { EventService } from './event.service';
import { RoomService } from './room.service';

// TODO: Have better (detailed/specific) event input type
export type ProcessInviteEvent = {
	event: EventBase & { origin: string; room_id: string; state_key: string };
	invite_room_state: unknown;
	room_version: string;
};

@injectable()
export class InviteService {
	private readonly logger = createLogger('InviteService');

	constructor(
		private readonly eventService: EventService,
		private readonly federationService: FederationService,
		private readonly configService: ConfigService,
		private readonly roomService: RoomService,
	) {}

	/**
	 * Invite a user to an existing room, or create a new room if none is provided
	 */
	async inviteUserToRoom(
		username: string,
		roomId?: string,
		sender?: string,
		name?: string,
	): Promise<InternalInviteUserResponse> {
		this.logger.debug(`Inviting ${username} to room ${roomId || 'new room'}`);

		const config = this.configService.getServerConfig();
		const signingKey = await this.configService.getSigningKey();
		let finalRoomId = roomId;

		if (!username.includes(':') || !username.includes('@')) {
			throw new HttpException('Invalid username', HttpStatus.BAD_REQUEST);
		}

		if (!finalRoomId && !name) {
			throw new HttpException(
				'Either roomId or name must be provided',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Check if the room exists and is not tombstoned
		if (finalRoomId) {
			const isTombstoned = await this.roomService.isRoomTombstoned(finalRoomId);
			if (isTombstoned) {
				throw new HttpException(
					'Cannot invite to a deleted room',
					HttpStatus.FORBIDDEN,
				);
			}
		}

		// Create room if no roomId was provided
		if (sender && !finalRoomId && name) {
			if (sender.split(':').pop() !== config.name) {
				throw new HttpException('Invalid sender', HttpStatus.BAD_REQUEST);
			}

			const { room_id: createdRoomId } = await this.roomService.createRoom(
				username,
				sender,
				name,
			);
			finalRoomId = createdRoomId;
		}

		if (!finalRoomId) {
			throw new HttpException('Invalid room_id', HttpStatus.BAD_REQUEST);
		}

		const roomEvents = await this.eventService.findEvents(
			{ 'event.room_id': finalRoomId },
			{ sort: { 'event.depth': 1 } },
		);

		if (roomEvents.length === 0) {
			throw new HttpException('No events found', HttpStatus.BAD_REQUEST);
		}

		const lastEvent = roomEvents[roomEvents.length - 1];
		const lastEventId = lastEvent._id;
		const currentTimestamp = Date.now();

		// Find auth events
		const createEvent =
			roomEvents.find((e) => e.event.type === 'm.room.create')?._id || '';
		const powerLevelsEvent =
			roomEvents.find((e) => e.event.type === 'm.room.power_levels')?._id || '';
		const joinRulesEvent =
			roomEvents.find((e) => e.event.type === 'm.room.join_rules')?._id || '';
		const historyVisibilityEvent =
			roomEvents.find((e) => e.event.type === 'm.room.history_visibility')
				?._id || '';

		// Create invite event
		const inviteEvent = await signEvent(
			roomMemberEvent({
				auth_events: {
					'm.room.create': createEvent,
					'm.room.power_levels': powerLevelsEvent,
					'm.room.join_rules': joinRulesEvent,
					'm.room.history_visibility': historyVisibilityEvent,
				},
				membership: 'invite',
				depth: (lastEvent.event.depth || 0) + 1,
				content: {
					is_direct: true,
				},
				roomId: finalRoomId,
				ts: currentTimestamp,
				prev_events: [lastEventId],
				sender: roomEvents[0].event.sender,
				state_key: username,
				unsigned: {
					age: 4,
					age_ts: currentTimestamp,
					invite_room_state: [
						{
							content: { join_rule: 'invite' },
							sender: roomEvents[0].event.sender,
							state_key: '',
							type: 'm.room.join_rules',
						},
						{
							content: {
								room_version: '10',
								creator: roomEvents[0].event.sender,
							},
							sender: roomEvents[0].event.sender,
							state_key: '',
							type: 'm.room.create',
						},
						{
							content: {
								membership: 'join',
								displayname: 'admin',
							},
							sender: roomEvents[0].event.sender,
							state_key: roomEvents[0].event.sender,
							type: 'm.room.member',
						},
						{
							type: 'm.room.name' as const,
							content: { name: name || 'New Room' }, // TODO: Revisit this since the room creation must not be here
							sender: roomEvents[0].event.sender,
							state_key: '',
						},
					],
				},
			}),
			Array.isArray(signingKey) ? signingKey[0] : signingKey,
			config.name,
		);

		const inviteEventId = generateId(inviteEvent);

		const payload = {
			event: inviteEvent,
			invite_room_state: inviteEvent.unsigned.invite_room_state,
			room_version: '10',
		};

		// TODO: Move it to the federation-sdk service
		const targetDomain = username.split(':').pop() as string;

		const responseMake = await makeUnsignedRequest({
			method: 'PUT',
			domain: targetDomain,
			uri: `/_matrix/federation/v2/invite/${finalRoomId}/${inviteEventId}`,
			body: payload,
			options: {},
			signingKey: Array.isArray(signingKey) ? signingKey[0] : signingKey,
			signingName: config.name,
		});

		if (responseMake && 'event' in responseMake) {
			const responseEventId = generateId(responseMake.event as EventBase);
			await this.eventService.insertEvent(
				responseMake.event as EventBase,
				responseEventId,
			);
		}

		return {
			event_id: inviteEventId,
			room_id: finalRoomId,
		};
	}

	async processInvite(
		event: ProcessInviteBody,
		roomId: string,
		eventId: string,
	): Promise<ProcessInviteResponse> {
		try {
			// Check if the room is tombstoned (deleted)
			const isTombstoned = await this.roomService.isRoomTombstoned(roomId);
			if (isTombstoned) {
				this.logger.warn(
					`Received invite for deleted room ${roomId}, rejecting`,
				);
				throw new ForbiddenException(
					'Cannot process invite for a deleted room',
				);
			}

			// TODO: Validate before inserting
			try {
				await this.eventService.insertEvent(event as EventBase, eventId);
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				this.logger.error(`Event already exists: ${errorMessage}`);
				throw error;
			}

			this.logger.debug('Received invite event', {
				room_id: roomId,
				event_id: eventId,
				user_id: event.state_key,
				origin: event.origin,
			});

			// TODO: Remove this - Waits 5 seconds before accepting invite just for testing purposes
			void new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
				this.acceptInvite(roomId, event.state_key),
			);

			return { event: event };
		} catch (error: any) {
			this.logger.error(`Failed to process invite: ${error.message}`);
			throw error;
		}
	}

	async acceptInvite(roomId: string, userId: string): Promise<void> {
		try {
			// Check if the room is tombstoned (deleted)
			const isTombstoned = await this.roomService.isRoomTombstoned(roomId);
			if (isTombstoned) {
				this.logger.warn(
					`Attempt to accept invite for deleted room ${roomId}, rejecting`,
				);
				throw new ForbiddenException(
					`Cannot accept invite for deleted room ${roomId}`,
				);
			}

			const inviteEvent = await this.eventService.findInviteEvent(
				roomId,
				userId,
			);

			if (!inviteEvent) {
				throw new Error(`No invite found for user ${userId} in room ${roomId}`);
			}

			await this.handleInviteProcessing({
				event: inviteEvent.event as EventBase & {
					origin: string;
					room_id: string;
					state_key: string;
				},
				invite_room_state: inviteEvent.invite_room_state,
				room_version: inviteEvent.room_version || '10',
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(`Failed to accept invite: ${errorMessage}`);
			throw error;
		}
	}

	private async handleInviteProcessing(
		event: ProcessInviteEvent,
	): Promise<void> {
		try {
			const responseMake = await this.federationService.makeJoin(
				event.event.origin,
				event.event.room_id,
				event.event.state_key,
				event.room_version,
			);
			const responseBody = await this.federationService.sendJoin(
				event.event.origin,
				event.event.room_id,
				event.event.state_key,
				responseMake.event,
				false,
			);

			if (!responseBody.state || !responseBody.auth_chain) {
				this.logger.warn(
					`Invalid response: missing state or auth_chain arrays from event ${event.event.event_id}`,
				);
				return;
			}

			const allEvents = [
				...responseBody.state,
				...responseBody.auth_chain,
				responseBody.event,
			];

			// TODO: Bring it back the validation pipeline for production - commented out for testing purposes
			// await this.eventService.processIncomingPDUs(allEvents);

			// TODO: Also remove the insertEvent calls :)
			for (const event of allEvents) {
				await this.eventService.insertEventIfNotExists(event);
			}

			this.logger.debug(
				`Inserted ${allEvents.length} events for room ${event.event.room_id} right after the invite was accepted`,
			);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Error processing invite for ${event.event.state_key} in room ${event.event.room_id}: ${errorMessage}`,
			);
			throw error;
		}
	}
}
