import { Elysia } from 'elysia';
import { injectable } from 'tsyringe';
import { container } from 'tsyringe';
import { InternalPingResponseDto } from '../../dtos/internal/ping.dto';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class InternalPingController extends BaseController {
	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/internal/ping',
				handler: async () => {
					return 'PONG!';
				},
				elysiaConfig: {
					response: {
						200: InternalPingResponseDto,
					},
					detail: {
						tags: ['Internal'],
						summary: 'Health check endpoint',
						description: 'Simple ping endpoint to check if the server is running'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const pingPlugin = (app: Elysia) => {
	const controller = container.resolve(InternalPingController);
	controller.registerElysiaRoutes(app);
	return app;
};
