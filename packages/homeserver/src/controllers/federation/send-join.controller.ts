import { isRoomMemberEvent } from '../../core/events/m.room.member';
import { Elysia } from 'elysia';
import { container, injectable } from 'tsyringe';
import { type ErrorResponse, type SendJoinResponse, ErrorResponseDto, SendJoinEventDto, SendJoinParamsDto, SendJoinResponseDto } from '../../dtos';
import { ConfigService } from '../../services/config.service';
import { EventService } from '../../services/event.service';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class FederationSendJoinController extends BaseController {
	constructor(
		private eventService: EventService,
		private configService: ConfigService
	) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'PUT',
				path: '/_matrix/federation/v2/send_join/:roomId/:stateKey',
				handler: async ({ params, body }): Promise<SendJoinResponse | ErrorResponse> => {
					const parseResult = SendJoinEventDto.safeParse(body);
					if (!parseResult.success) {
						return {
							error: 'Invalid event body',
							details: parseResult.error.flatten(),
						};
					}
					const event = parseResult.data;
					const { roomId, stateKey } = params;

					const records = await this.eventService.findEvents(
						{ 'event.room_id': roomId },
						{ sort: { 'event.depth': 1 } },
					);
					const events = records.map((event) => event.event);
					const lastInviteEvent = records.find(
						(record) =>
							isRoomMemberEvent(record.event) &&
							record.event.content.membership === 'invite',
					);
					const eventToSave = {
						...event,
						origin: event.origin || this.configService.getServerConfig().name,
					};
					const result = {
						event: {
							...event,
							unsigned: lastInviteEvent
								? {
										replaces_state: lastInviteEvent._id,
										prev_content: lastInviteEvent.event.content,
										prev_sender: lastInviteEvent.event.sender,
									}
								: undefined,
						},
						state: events.map((event) => ({ ...event })),
						auth_chain: events
							.filter((event) => event.depth && event.depth <= 4)
							.map((event) => ({ ...event })),
						members_omitted: false,
						origin: this.configService.getServerConfig().name,
					};
					if ((await this.eventService.findEvents({ _id: stateKey })).length === 0) {
						await this.eventService.insertEvent(eventToSave, stateKey);
					}
					return result;
				},
				elysiaConfig: {
					params: SendJoinParamsDto,
					body: SendJoinEventDto,
					response: {
						200: SendJoinResponseDto,
						400: ErrorResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Send join',
						description: 'Send a join event to a room'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const sendJoinPlugin = (app: Elysia) => {
	const controller = container.resolve(FederationSendJoinController);
	controller.registerElysiaRoutes(app);
	return app;
};
