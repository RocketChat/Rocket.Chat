import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings';

import { getOpenIdTokenSubject } from '../../matrixrtc/openid';

const isUserInfoResponseProps = ajv.compile<{ sub: string }>({
	type: 'object',
	properties: { sub: { type: 'string' } },
	required: ['sub'],
});

const isUnknownTokenResponseProps = ajv.compile<{ errcode: 'M_UNKNOWN_TOKEN'; error: string }>({
	type: 'object',
	properties: { errcode: { type: 'string', const: 'M_UNKNOWN_TOKEN' }, error: { type: 'string' } },
	required: ['errcode', 'error'],
});

export const getMatrixOpenIdRoutes = () => {
	// GET /_matrix/federation/v1/openid/userinfo
	// https://spec.matrix.org/v1.19/server-server-api/#get_matrixfederationv1openiduserinfo
	return new Router('/federation').get(
		'/v1/openid/userinfo',
		{
			response: {
				200: isUserInfoResponseProps,
				401: isUnknownTokenResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async (c) => {
			const sub = getOpenIdTokenSubject(c.req.query('access_token') ?? '');
			if (!sub) {
				return {
					statusCode: 401,
					body: { errcode: 'M_UNKNOWN_TOKEN', error: 'The token was not recognized or has expired' },
				};
			}

			return { statusCode: 200, body: { sub } };
		},
	);
};
