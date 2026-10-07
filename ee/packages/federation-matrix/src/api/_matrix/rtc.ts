import type { TypedOptions } from '@rocket.chat/http-router';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings';
import type { Context } from 'hono';

import { grantFederationToken } from '../../matrixrtc/tokens/federation';
import { answerTokenRequest, readTokenRequestBody, tokenEndpointResponses } from '../matrixrtc/answer';
import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

const isGetTokenResponseProps = ajv.compile<{ jwt: string }>({
	type: 'object',
	properties: { jwt: { type: 'string' } },
	required: ['jwt'],
});

export const getMatrixRTCRoutes = () => {
	const options = {
		response: tokenEndpointResponses(isGetTokenResponseProps),
		tags: ['Federation'],
		license: ['federation'],
	} satisfies TypedOptions;

	const getToken = async (c: Context) =>
		answerTokenRequest(async () => grantFederationToken(c.get('authenticatedServer'), await readTokenRequestBody(c)));

	return (
		new Router('/federation')
			// POST /_matrix/federation/unstable/io.element.msc4195/rtc/livekit/get_token
			// https://github.com/matrix-org/matrix-spec-proposals/pull/4195
			.post('/unstable/io.element.msc4195/rtc/livekit/get_token', options, isAuthenticatedMiddleware(), getToken)
			// POST /_matrix/federation/v1/rtc/livekit/get_token: the same, once MSC4195 is stable
			.post('/v1/rtc/livekit/get_token', options, isAuthenticatedMiddleware(), getToken)
	);
};
