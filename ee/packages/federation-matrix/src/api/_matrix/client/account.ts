import { federationSDK } from '@rocket.chat/federation-sdk';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import { isMatrixErrorProps, license, tags } from './_shared';
import { createOrUpdateFederatedUser } from '../../../helpers/createOrUpdateFederatedUser';
import { decodeXmppUserId, isFullXmppUserId, parseXmppUserId } from '../../../helpers/parseXmppUserId';
import { logger } from '../../logger';
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

				const decoded = decodeXmppUserId(body.username);

				if (!isFullXmppUserId(decoded)) {
					await createOrUpdateFederatedUser({
						username: body.username,
						origin: serverName,
					});

					return {
						statusCode: 200,
						body: {
							user_id: body.username,
						},
					};
				}

				const decodedUsername = parseXmppUserId(decoded);
				if (!decodedUsername.resource) {
					logger.warn({ msg: 'Could not derive resource from full XMPP user id during AS registration', username: body.username });
					return {
						statusCode: 400,
						body: {
							errcode: '',
							error: '',
						},
					};
				}

				const username = `@${decodedUsername.resource}:${serverName}`;

				await createOrUpdateFederatedUser({
					username,
					// name: decodedUsername.resource,
					origin: serverName,
				});

				return {
					statusCode: 200,
					body: {
						user_id: username,
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
				const username = c.get('impersonatedUserId') as string;
				return {
					statusCode: 200,
					body: {
						user_id: username,
					},
				};
			},
		);
};
