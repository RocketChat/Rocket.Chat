import { injectable } from 'tsyringe';
import { ProcessInviteBodyDto, ProcessInviteParamsDto, ProcessInviteResponseDto } from '../../dtos/federation/invite.dto';
import { InviteService } from '../../services/invite.service';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class FederationInviteController extends BaseController {
	constructor(private readonly inviteService: InviteService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'PUT',
				path: '/_matrix/federation/v2/invite/:roomId/:eventId',
				handler: async (context) => {
					const { roomId, eventId } = context.params;
					return this.inviteService.processInvite(context.body, roomId, eventId);
				},
				elysiaConfig: {
					params: ProcessInviteParamsDto,
					body: ProcessInviteBodyDto,
					response: {
						200: ProcessInviteResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Process room invite',
						description: 'Process an invite event from another Matrix server'
					}
				}
			}
		];
	}
}

// Export the old plugin for backward compatibility (can be removed later)
export const invitePlugin = (app: any) => {
	const controller = new FederationInviteController(app.resolve(InviteService));
	controller.registerElysiaRoutes(app);
	return app;
};