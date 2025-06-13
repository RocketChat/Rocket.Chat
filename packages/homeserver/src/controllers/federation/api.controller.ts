import { injectable } from 'tsyringe';
import { BaseController, type RouteHandler } from '../base.controller';
import { EventService } from '../../services/event.service';
import { FederationService } from '../../federation-sdk';
import { InviteService } from '../../services/invite.service';
import { RoomService } from '../../services/room.service';
import { ProfilesService } from '../../services/profiles.service';

@injectable()
export class FederationApiController extends BaseController {
	constructor(
		private readonly eventService: EventService,
		private readonly federationService: FederationService,
		private readonly inviteService: InviteService,
		private readonly roomService: RoomService,
		private readonly profilesService: ProfilesService,
	) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/_matrix/federation/v1/state/:roomId',
				handler: async (context) => {
					const { roomId } = context.params;
					const eventId = context.query.event_id;

					try {
						// TODO: Fix this
						// const state = await this.eventService.getRoomState(roomId, eventId);
						// return state;
						return {
							room_id: roomId,
							event_id: eventId,
							state: [],
						};
					} catch (error) {
						context.set.status(404);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'GET',
				path: '/_matrix/federation/v1/state_ids/:roomId',
				handler: async (context) => {
					const { roomId } = context.params;
					const eventId = context.query.event_id;

					try {
						// TODO: Fix this
						// const stateIds = await this.federationService.getRoomStateIds(roomId, eventId);
						// return stateIds;
						return {
							room_id: roomId,
							event_id: eventId,
							state_ids: [],
						};
					} catch (error) {
						context.set.status(404);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'POST',
				path: '/_matrix/federation/v1/user/keys/query',
				handler: async (context) => {
					const { device_keys } = context.body;

					try {
						const keys = await this.profilesService.queryKeys(device_keys);
						return keys;
					} catch (error) {
						context.set.status(500);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'GET',
				path: '/_matrix/federation/v1/make_join/:roomId/:userId',
				handler: async (context) => {
					const { roomId, userId } = context.params;

					try {
						const joinEvent = await this.federationService.makeJoin(roomId, userId, '1');
						return joinEvent;
					} catch (error) {
						context.set.status(403);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'POST',
				path: '/_matrix/federation/v1/send_join/:roomId/:eventId',
				handler: async (context) => {
					const { roomId, eventId } = context.params;
					const event = context.body;

					try {
						// Note: This is using processInvite but should probably be a different method
						// TODO: Create a proper sendJoin method in the service
						const result = await this.inviteService.processInvite(event, roomId, eventId);
						return result;
					} catch (error) {
						context.set.status(400);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			// Internal API endpoints for Rocket.Chat integration
			{
				method: 'POST',
				path: '/api/v1/federation/event',
				handler: async (context) => {
					try {
						await this.eventService.processIncomingPDUs(context.body);
						return { success: true };
					} catch (error) {
						context.set.status(500);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'POST',
				path: '/api/v1/federation/send',
				handler: async (context) => {
					// const { roomId, event } = context.body;
					
					try {
						// TODO: Fix this
						// await this.eventService.processIncomingPDUs([event], roomId);
						return { success: true };
					} catch (error) {
						context.set.status(500);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'POST',
				path: '/api/v1/federation/join',
				handler: async (context) => {
					// const { roomId, serverName } = context.body;
					
					try {
						// TODO: Fix this
						// await this.roomService.join(roomId, serverName, '1');
						return { success: true };
					} catch (error) {
						context.set.status(500);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'POST',
				path: '/api/v1/federation/leave',
				handler: async (context) => {
					const { roomId, senderUserId } = context.body;
					
					try {
						await this.roomService.leaveRoom(roomId, senderUserId);
						return { success: true };
					} catch (error) {
						context.set.status(500);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'POST',
				path: '/api/v1/federation/invite',
				handler: async (context) => {
					// const { userId, roomId } = context.body;
					
					try {
						// TODO: Fix this
						// await this.federationService.inviteUser(userId, roomId);
						return { success: true };
					} catch (error) {
						context.set.status(500);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'GET',
				path: '/api/v1/federation/discover/:serverName',
				handler: async (context) => {
					const { serverName } = context.params;
					
					try {
						// const serverInfo = await this.federationService.discoverServer(serverName);
						// return serverInfo;
						return {
							server_name: serverName,
							server_info: {
								address: '127.0.0.1',
								port: 8448,
							},
						};
					} catch (error) {
						context.set.status(404);
						return { error: error instanceof Error ? error.message : 'Unknown error' };
					}
				},
			},
			{
				method: 'GET',
				path: '/health',
				handler: async (_context) => {
					return {
						status: 'healthy',
						timestamp: new Date().toISOString(),
					};
				},
			},
		];
	}
}

// Export the old plugin for backward compatibility
export const federationApiPlugin = (app: any) => {
	const controller = app.resolve(FederationApiController);
	controller.registerElysiaRoutes(app);
	return app;
};