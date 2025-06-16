import { Elysia } from 'elysia';
import { container, injectable, inject } from 'tsyringe';
import { toUnpaddedBase64 } from '../../binaryData';
import { ServerKeyResponseDto } from '../../dtos';
import type { SigningKey } from '../../keys';
import { ConfigService } from '../../services/config.service';
import { signJson } from '../../signJson';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class KeyServerController extends BaseController {
	constructor(@inject('ConfigService') private configService: ConfigService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'GET',
				path: '/_matrix/key/v2/server',
				handler: async () => {
					const config = this.configService.getConfig();
					const signingKeys = await this.configService.getSigningKey();

					const keys = Object.fromEntries(
						signingKeys.map((signingKey: SigningKey) => [
							`${signingKey.algorithm}:${signingKey.version}`,
							{
								key: toUnpaddedBase64(signingKey.publicKey),
							},
						]),
					);

					const baseResponse = {
						old_verify_keys: {},
						server_name: config.server.name,
						signatures: {},
						valid_until_ts: new Date().getTime() + 60 * 60 * 24 * 1000, // 1 day
						verify_keys: keys,
					};

					let signedResponse = baseResponse;
					for (const key of signingKeys) {
						signedResponse = await signJson(signedResponse, key, config.server.name);
					}

					return signedResponse;
				},
				elysiaConfig: {
					response: {
						200: ServerKeyResponseDto,
					},
					detail: {
						tags: ['Key'],
						summary: 'Get server key',
						description: 'Get the server key'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const serverKeyPlugin = (app: Elysia) => {
	const controller = container.resolve(KeyServerController);
	controller.registerElysiaRoutes(app);
	return app;
};
