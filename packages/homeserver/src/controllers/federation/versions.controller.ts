import { Elysia } from "elysia";
import { container, injectable, inject } from "tsyringe";
import { GetVersionsResponseDto } from "../../dtos";
import { ConfigService } from "../../services/config.service";
import { BaseController, type RouteHandler } from "../base.controller";

@injectable()
export class FederationVersionsController extends BaseController {
	constructor(@inject('ConfigService') private configService: ConfigService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/_matrix/federation/v1/version',
				handler: async () => {
					const config = this.configService.getServerConfig();
					return {
						server: {
							name: config.name,
							version: config.version,
						},
					};
				},
				elysiaConfig: {
					response: {
						200: GetVersionsResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Get versions',
						description: 'Get the versions of the server'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const versionsPlugin = (app: Elysia) => {
	const controller = container.resolve(FederationVersionsController);
	controller.registerElysiaRoutes(app);
	return app;
};
