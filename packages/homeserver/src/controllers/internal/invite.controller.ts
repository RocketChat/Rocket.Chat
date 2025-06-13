import { Elysia } from 'elysia';
import { container, injectable } from 'tsyringe';
import { type ErrorResponse, ErrorResponseDto, InternalInviteUserBodyDto, type InternalInviteUserResponse, InternalInviteUserResponseDto } from '../../dtos';
import { InviteService } from '../../services/invite.service';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class InternalInviteController extends BaseController {
	constructor(private inviteService: InviteService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'POST',
				path: '/internal/invites',
				handler: async ({ body, set }): Promise<InternalInviteUserResponse | ErrorResponse> => {
					const { username, roomId, sender, name } = body;
					try {
						return this.inviteService.inviteUserToRoom(
							username,
							roomId,
							sender,
							name,
						);
					} catch (error) {
						set.status(500);
						return {
							error: `Failed to invite user: ${error instanceof Error ? error.message : String(error)}`,
							details: {},
						};
					}
				},
				elysiaConfig: {
					body: InternalInviteUserBodyDto,
					response: {
						200: InternalInviteUserResponseDto,
						400: ErrorResponseDto,
					},
					detail: {
						tags: ['Internal'],
						summary: 'Invite user to room',
						description: 'Invite a user to a room'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const internalInvitePlugin = (app: Elysia) => {
	const controller = container.resolve(InternalInviteController);
	controller.registerElysiaRoutes(app);
	return app;
};
