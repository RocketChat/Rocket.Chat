import { federationSDK } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	internalError,
	notImplemented,
	isEmptyObjectResponseProps,
	isImpersonationQueryProps,
	isMatrixErrorProps,
	isProfileFieldParamsProps,
	isUserIdParamsProps,
	license,
	tags,
} from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const ProfileGetResponseSchema = {
	type: 'object',
	properties: {
		displayname: { type: 'string', nullable: true },
		avatar_url: { type: 'string', nullable: true },
	},
	additionalProperties: true,
};

const isProfileGetResponseProps = ajv.compile(ProfileGetResponseSchema);

const DisplaynameBodySchema = {
	type: 'object',
	properties: {
		displayname: { type: 'string', nullable: true },
	},
	required: ['displayname'],
};

const isDisplaynameBodyProps = ajv.compile(DisplaynameBodySchema);

const AvatarUrlBodySchema = {
	type: 'object',
	properties: {
		avatar_url: { type: 'string', nullable: true },
	},
	required: ['avatar_url'],
};

const isAvatarUrlBodyProps = ajv.compile(AvatarUrlBodySchema);

const ALLOWED_PROFILE_FIELDS = ['displayname', 'avatar_url'];

export const addProfileRoutes = (router: ClientRouter) => {
	router
		// GET /_matrix/client/v3/profile/:userId
		.get(
			'/v3/profile/:userId',
			{
				params: isUserIdParamsProps,
				response: {
					200: isProfileGetResponseProps,
					401: isMatrixErrorProps,
					404: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const userId = c.req.param('userId');
				try {
					// TODO maybe this can be a query to our models instead of going through the federation-sdk
					const profile = await federationSDK.queryProfile(userId);
					if (!profile) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Profile not found',
							},
						};
					}
					return {
						statusCode: 200,
						body: {
							displayname: profile.displayname,
							...(profile.avatar_url ? { avatar_url: profile.avatar_url } : {}),
						},
					};
				} catch (error) {
					return internalError('Failed to fetch profile', error, { userId });
				}
			},
		)

		// GET /_matrix/client/v3/profile/:userId/:field
		.get(
			'/v3/profile/:userId/:field',
			{
				params: isProfileFieldParamsProps,
				response: {
					200: isProfileGetResponseProps,
					400: isMatrixErrorProps,
					401: isMatrixErrorProps,
					404: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const userId = c.req.param('userId');
				const field = c.req.param('field');

				if (!field || !ALLOWED_PROFILE_FIELDS.includes(field)) {
					return {
						statusCode: 400,
						body: { errcode: 'M_INVALID_PARAM', error: 'Unknown profile field' },
					};
				}

				try {
					// TODO maybe this can be a query to our models instead of going through the federation-sdk
					const profile = await federationSDK.queryProfile(userId);
					if (!profile) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Profile not found',
							},
						};
					}
					return {
						statusCode: 200,
						body: {
							[field]: profile[field as keyof typeof profile],
						},
					};
				} catch (error) {
					return internalError('Failed to fetch profile', error, { userId, field });
				}
			},
		)

		// PUT /_matrix/client/v3/profile/:userId/displayname
		.put(
			'/v3/profile/:userId/displayname',
			{
				params: isUserIdParamsProps,
				query: isImpersonationQueryProps,
				body: isDisplaynameBodyProps,
				response: {
					200: isEmptyObjectResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					404: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const userId = c.req.param('userId');
				const username = c.get('impersonatedUserId') as string;

				// A bridge always targets the user it impersonates, so user_id mirrors the path
				// param (both in packed form for XMPP puppets). The exception is the bot setting
				// its own displayname, where user_id is omitted and impersonatedUserId holds the
				// bot's MXID verbatim.
				if (userId !== (c.req.query('user_id') ?? username)) {
					return {
						statusCode: 403,
						body: { errcode: 'M_FORBIDDEN', error: 'Cannot set the displayname of another user' },
					};
				}

				const body = await c.req.json();

				const user = await Users.findOneByUsername(username);
				if (!user) {
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'User not found',
						},
					};
				}

				await Users.setName(user._id, body.displayname);

				return {
					statusCode: 200,
					body: {},
				};
			},
		)

		// PUT /_matrix/client/v3/profile/:userId/avatar_url
		.put(
			'/v3/profile/:userId/avatar_url',
			{
				params: isUserIdParamsProps,
				query: isImpersonationQueryProps,
				body: isAvatarUrlBodyProps,
				response: {
					200: isEmptyObjectResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					404: isMatrixErrorProps,
					501: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const userId = c.req.param('userId');
				const username = c.get('impersonatedUserId') as string;

				const user = await Users.findOneByUsername(username);
				if (!user) {
					return {
						statusCode: 404,
						body: {
							errcode: 'M_NOT_FOUND',
							error: 'User not found',
						},
					};
				}

				// TODO(federation-sdk): setUserProfile(userId, {displayname?, avatar_url?}) — global, propagates to rooms
				return notImplemented('Global profile update not yet implemented', { userId });
			},
		);
};
