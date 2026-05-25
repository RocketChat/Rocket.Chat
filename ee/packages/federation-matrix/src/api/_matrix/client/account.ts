import { federationSDK } from '@rocket.chat/federation-sdk';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import { isMatrixErrorProps, license, tags } from './_shared';
import { createOrUpdateFederatedUser } from '../../../helpers/createOrUpdateFederatedUser';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const RegisterBodySchema = {
	type: 'object',
	properties: {
		type: { type: 'string' },
		username: { type: 'string' },
	},
	required: ['type', 'username'],
	additionalProperties: true,
};

const isRegisterBodyProps = ajv.compile(RegisterBodySchema);

const RegisterResponseSchema = {
	type: 'object',
	properties: {
		user_id: { type: 'string' },
		home_server: { type: 'string' },
		access_token: { type: 'string' },
	},
};

const isRegisterResponseProps = ajv.compile(RegisterResponseSchema);

const WhoamiResponseSchema = {
	type: 'object',
	properties: {
		user_id: { type: 'string' },
		device_id: { type: 'string' },
		is_guest: { type: 'boolean' },
	},
	required: ['user_id'],
	additionalProperties: true,
};

const isWhoamiResponseProps = ajv.compile(WhoamiResponseSchema);

export const addAccountRoutes = (router: ClientRouter) => {
	router
		// POST /_matrix/client/v3/register
		.post(
			'/v3/register',
			{
				body: isRegisterBodyProps,
				response: {
					200: isRegisterResponseProps,
					400: isMatrixErrorProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					501: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const body = await c.req.json();
				if (body.type !== 'm.login.application_service') {
					return {
						statusCode: 400,
						body: {
							errcode: 'M_FORBIDDEN',
							error: 'AS registration requires auth.type=m.login.application_service',
						},
					};
				}

				const serverName = federationSDK.getConfig('serverName');
				const userId = `@${body.username}:${serverName}`;

				// TODO may need to parse name and username, currently they're saved as @_xmpp_prince=2fmychannel=40conference.xmpp.host:rc.host

				await createOrUpdateFederatedUser({
					username: userId,
					name: userId,
					origin: serverName,
				});

				return {
					statusCode: 200,
					body: {
						user_id: userId,
					},
				};
			},
		)

		// GET /_matrix/client/v3/account/whoami
		.get(
			'/v3/account/whoami',
			{
				response: {
					200: isWhoamiResponseProps,
					401: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const userId = c.get('impersonatedUserId') as string;
				return {
					statusCode: 200,
					body: {
						user_id: userId,
					},
				};
			},
		);
};
