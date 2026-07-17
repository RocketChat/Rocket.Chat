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
	required: ['user_id'],
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

				// An application service may only register users that no *other* bridge exclusively claims.
				// Registering within its own exclusive namespace is fine; another bridge's is M_EXCLUSIVE.
				const appService = c.get('appService') as ReturnType<typeof federationSDK.getRegistrationByAsToken>;

				const isReservedByAnotherAppService = (candidate: string): boolean => {
					const mxid = candidate.startsWith('@') ? candidate : `@${candidate}:${serverName}`;
					const owner = federationSDK.isExclusiveNamespace('users', mxid);
					return Boolean(owner && owner.registration._id !== appService?.registration._id);
				};

				const decoded = decodeXmppUserId(body.username);

				if (!isFullXmppUserId(decoded)) {
					// The spec defines `username` as the desired localpart; normalize either form to the
					// fully-qualified MXID, which is what gets stored and what `user_id` must carry.
					const withSigil = body.username.startsWith('@') ? body.username : `@${body.username}`;
					const userId = withSigil.includes(':') ? withSigil : `${withSigil}:${serverName}`;

					if (isReservedByAnotherAppService(userId)) {
						return {
							statusCode: 400,
							body: {
								errcode: 'M_EXCLUSIVE',
								error: 'Username is in an exclusive namespace of another application service',
							},
						};
					}

					await createOrUpdateFederatedUser({
						username: userId,
						origin: serverName,
						asId: appService?.registration._id,
					});

					return {
						statusCode: 200,
						body: {
							user_id: userId,
						},
					};
				}

				let decodedUsername;
				try {
					decodedUsername = parseXmppUserId(decoded);
				} catch (error) {
					logger.warn({ msg: 'Malformed XMPP user id during AS registration', username: body.username, err: error });
					return {
						statusCode: 400,
						body: {
							errcode: 'M_INVALID_USERNAME',
							error: 'Could not derive a username from the provided XMPP user id',
						},
					};
				}

				if (!decodedUsername.resource) {
					logger.warn({ msg: 'Could not derive resource from full XMPP user id during AS registration', username: body.username });
					return {
						statusCode: 400,
						body: {
							errcode: 'M_INVALID_USERNAME',
							error: 'Could not derive a username from the provided XMPP user id',
						},
					};
				}

				const username = `@${decodedUsername.resource}:${serverName}`;

				if (isReservedByAnotherAppService(username)) {
					return {
						statusCode: 400,
						body: {
							errcode: 'M_EXCLUSIVE',
							error: 'Username is in an exclusive namespace of another application service',
						},
					};
				}

				await createOrUpdateFederatedUser({
					username,
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
