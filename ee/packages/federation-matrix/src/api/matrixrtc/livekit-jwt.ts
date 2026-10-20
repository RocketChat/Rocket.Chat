import type { TypedOptions } from '@rocket.chat/http-router';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings';
import { cors } from 'hono/cors';

import { answerTokenRequest, readTokenRequestBody, tokenEndpointResponses } from './answer';
import { MATRIXRTC_TOKEN_SERVICE_PATH, grantServiceToken, grantSfuGetToken } from '../../matrixrtc/tokens/service';
import { isFederationEnabledMiddleware } from '../middlewares/isFederationEnabled';
import { isLicenseEnabledMiddleware } from '../middlewares/isLicenseEnabled';

const isSfuResponseProps = ajv.compile<{ url: string; jwt: string }>({
	type: 'object',
	properties: { url: { type: 'string' }, jwt: { type: 'string' } },
	required: ['url', 'jwt'],
});

const isHealthResponseProps = ajv.compile<Record<string, never>>({ type: 'object' });

/**
 * The lk-jwt-service contract, for the members of other homeservers whose membership names this server's token
 * service: Element Call, or another Rocket.Chat in compatibility mode.
 */
export const getMatrixRTCTokenServiceRoutes = () => {
	const options = {
		response: tokenEndpointResponses(isSfuResponseProps),
		tags: ['MatrixRTC'],
		license: ['federation'],
	} satisfies TypedOptions;

	return (
		new Router(MATRIXRTC_TOKEN_SERVICE_PATH)
			// Element Call asks from the browser, from its own origin.
			.use(
				cors({
					origin: '*',
					allowMethods: ['POST', 'OPTIONS'],
					allowHeaders: ['Accept', 'Content-Type', 'Content-Length', 'Accept-Encoding', 'X-CSRF-Token'],
				}),
			)
			.use(isFederationEnabledMiddleware)
			.use(isLicenseEnabledMiddleware)
			.post('/get_token', options, async (c) => answerTokenRequest(async () => grantServiceToken(await readTokenRequestBody(c))))
			.post('/sfu/get', options, async (c) => answerTokenRequest(async () => grantSfuGetToken(await readTokenRequestBody(c))))
			.get('/healthz', { response: { 200: isHealthResponseProps }, tags: ['MatrixRTC'], license: ['federation'] }, async () => ({
				statusCode: 200,
				body: {},
			}))
	);
};
