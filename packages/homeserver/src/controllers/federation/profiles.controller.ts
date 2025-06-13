import { Elysia } from 'elysia';
import { container, injectable } from 'tsyringe';
import {
	type ErrorResponse,
	type MakeJoinResponse,
	ErrorResponseDto,
	EventAuthParamsDto,
	EventAuthResponseDto,
	GetDevicesParamsDto,
	GetDevicesResponseDto,
	GetMissingEventsBodyDto,
	GetMissingEventsParamsDto,
	GetMissingEventsResponseDto,
	MakeJoinParamsDto,
	MakeJoinQueryDto,
	MakeJoinResponseDto,
	QueryKeysBodyDto,
	QueryKeysResponseDto,
	QueryProfileQueryDto,
	QueryProfileResponseDto
} from '../../dtos';
import { ProfilesService } from '../../services/profiles.service';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class FederationProfilesController extends BaseController {
	constructor(private profilesService: ProfilesService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/_matrix/federation/v1/query/profile',
				handler: async ({ query }) => this.profilesService.queryProfile(query.user_id),
				elysiaConfig: {
					query: QueryProfileQueryDto,
					response: {
						200: QueryProfileResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Query profile',
						description: 'Query a user\'s profile'
					}
				}
			},
			{
				method: 'POST',
				path: '/_matrix/federation/v1/user/keys/query',
				handler: async ({ body }) => this.profilesService.queryKeys(body.device_keys),
				elysiaConfig: {
					body: QueryKeysBodyDto,
					response: {
						200: QueryKeysResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Query keys',
						description: 'Query a user\'s device keys'
					}
				}
			},
			{
				method: 'GET',
				path: '/_matrix/federation/v1/user/devices/:userId',
				handler: async ({ params }) => this.profilesService.getDevices(params.userId),
				elysiaConfig: {
					params: GetDevicesParamsDto,
					response: {
						200: GetDevicesResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Get devices',
						description: 'Get a user\'s devices'
					}
				}
			},
			{
				method: 'GET',
				path: '/_matrix/federation/v1/make_join/:roomId/:userId',
				handler: async ({ params, query }): Promise<MakeJoinResponse | ErrorResponse> => {
					const parsed = MakeJoinQueryDto.safeParse(query);
					if (!parsed.success) {
						return {
							error: 'Invalid query params',
							details: parsed.error.flatten(),
						};
					}
					const response = await this.profilesService.makeJoin(
						params.roomId,
						params.userId,
						parsed.data.ver,
					);
					return {
						room_version: response.room_version,
						event: {
							...response.event,
							content: {
								...response.event.content,
								membership: 'join',
								join_authorised_via_users_server:
									response.event.content.join_authorised_via_users_server,
							},
							room_id: response.event.room_id,
							sender: response.event.sender,
							state_key: response.event.state_key,
							type: 'm.room.member',
							origin_server_ts: response.event.origin_server_ts,
							origin: response.event.origin,
						},
					};
				},
				elysiaConfig: {
					params: MakeJoinParamsDto,
					query: MakeJoinQueryDto,
					response: {
						200: MakeJoinResponseDto,
						400: ErrorResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Make join',
						description: 'Make a join event'
					}
				}
			},
			{
				method: 'POST',
				path: '/_matrix/federation/v1/get_missing_events/:roomId',
				handler: async ({ params, body }) =>
					this.profilesService.getMissingEvents(
						params.roomId,
						body.earliest_events,
						body.latest_events,
						body.limit,
					),
				elysiaConfig: {
					params: GetMissingEventsParamsDto,
					body: GetMissingEventsBodyDto,
					response: {
						200: GetMissingEventsResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Get missing events',
						description: 'Get missing events for a room'
					}
				}
			},
			{
				method: 'GET',
				path: '/_matrix/federation/v1/event_auth/:roomId/:eventId',
				handler: async ({ params }) =>
					this.profilesService.eventAuth(params.roomId, params.eventId),
				elysiaConfig: {
					params: EventAuthParamsDto,
					response: {
						200: EventAuthResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Event auth',
						description: 'Get event auth for a room'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const profilesPlugin = (app: Elysia) => {
	const controller = container.resolve(FederationProfilesController);
	controller.registerElysiaRoutes(app);
	return app;
};
