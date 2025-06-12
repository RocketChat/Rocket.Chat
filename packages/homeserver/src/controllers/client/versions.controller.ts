import { injectable } from 'tsyringe';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class ClientVersionsController extends BaseController {
	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/_matrix/client/versions',
				handler: async (_context) => {
					return {
						versions: ['r0.6.1', 'v1.1', 'v1.2', 'v1.3'],
						unstable_features: {
							'org.matrix.label_based_filtering': true,
							'org.matrix.e2e_cross_signing': true,
							'org.matrix.msc2432': true,
						},
					};
				},
			},
			{
				method: 'GET',
				path: '/_matrix/client/r0/sync',
				handler: async (_context) => {
					// This would typically be handled by the main Rocket.Chat server
					// Here we just provide a stub response
					return {
						next_batch: 'token',
						rooms: {
							join: {},
							invite: {},
							leave: {},
						},
						presence: {
							events: [],
						},
						account_data: {
							events: [],
						},
					};
				},
			},
		];
	}
}

// Export the old plugin for backward compatibility
export const clientVersionsPlugin = (app: any) => {
	const controller = new ClientVersionsController();
	controller.registerElysiaRoutes(app);
	return app;
};