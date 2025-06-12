import { Elysia } from 'elysia';
import { container, injectable } from 'tsyringe';
import { WellKnownServerResponseDto } from '../../dtos';
import { WellKnownService } from '../../services/well-known.service';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class WellKnownController extends BaseController {
	constructor(private wellKnownService: WellKnownService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/.well-known/matrix/server',
				handler: async ({ set }) => {
					const responseData = this.wellKnownService.getWellKnownHostData();
					const etag = new Bun.CryptoHasher('md5')
						.update(JSON.stringify(responseData))
						.digest('hex');
					set.headers({ 
						'ETag': etag,
						'Content-Type': 'application/json'
					});
					return responseData;
				},
				elysiaConfig: {
					response: {
						200: WellKnownServerResponseDto,
					},
					detail: {
						tags: ['Well-Known'],
						summary: 'Get well-known host data',
						description: 'Get the well-known host data'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const wellKnownPlugin = (app: Elysia) => {
	const controller = container.resolve(WellKnownController);
	controller.registerElysiaRoutes(app);
	return app;
};
