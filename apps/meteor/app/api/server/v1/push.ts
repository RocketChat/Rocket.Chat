import { Push } from '@rocket.chat/core-services';
import type { IPushToken, IPushTokenTypes } from '@rocket.chat/core-typings';
import { Messages, PushToken, Users, Rooms, Settings } from '@rocket.chat/models';
import {
	ajv,
	validateNotFoundErrorResponse,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import type { JSONSchemaType } from 'ajv';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { executePushTest } from '../../../../server/lib/pushConfig';
import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import PushNotification from '../../../push-notifications/server/lib/PushNotification';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import type { SuccessResult } from '../definition';

type PushTokenPOST = {
	id?: string;
	type: IPushTokenTypes;
	value: string;
	appName: string;
	voipToken?: string;
};

const PushTokenPOSTSchema: JSONSchemaType<PushTokenPOST> = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			enum: ['apn', 'gcm'],
		},
		value: {
			type: 'string',
			minLength: 1,
		},
		appName: {
			type: 'string',
			minLength: 1,
		},
		voipToken: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['type', 'value', 'appName'],
	additionalProperties: false,
};

export const isPushTokenPOSTProps = ajv.compile<PushTokenPOST>(PushTokenPOSTSchema);

type PushTokenDELETE = {
	token: string;
};

const PushTokenDELETESchema: JSONSchemaType<PushTokenDELETE> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isPushTokenDELETEProps = ajv.compile<PushTokenDELETE>(PushTokenDELETESchema);

type PushTokenResult = Pick<IPushToken, '_id' | 'token' | 'appName' | 'userId' | 'enabled' | 'createdAt' | '_updatedAt' | 'voipToken'>;

/**
 * Pick only the attributes we actually want to return on the endpoint, ensuring nothing from older schemas get mixed in
 */
function cleanTokenResult(result: Omit<IPushToken, 'authToken'>): PushTokenResult {
	const { _id, token, appName, userId, enabled, createdAt, _updatedAt, voipToken } = result;

	return {
		_id,
		token,
		appName,
		userId,
		enabled,
		createdAt,
		_updatedAt,
		voipToken,
	};
}

const pushTokenEndpoints = API.v1
	.post(
		'push.token',
		{
			response: {
				200: ajv.compile<SuccessResult<{ result: PushTokenResult }>['body']>({
					additionalProperties: false,
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
						result: {
							type: 'object',
							description: 'The updated token data for this device',
							properties: {
								_id: {
									type: 'string',
								},
								token: {
									type: 'object',
									properties: {
										apn: {
											type: 'string',
										},
										gcm: {
											type: 'string',
										},
									},
									required: [],
									additionalProperties: false,
								},
								appName: {
									type: 'string',
								},
								userId: {
									type: 'string',
									nullable: true,
								},
								enabled: {
									type: 'boolean',
								},
								createdAt: {
									type: 'string',
								},
								_updatedAt: {
									type: 'string',
								},
								voipToken: {
									type: 'string',
								},
							},
							additionalProperties: false,
						},
					},
					required: ['success', 'result'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			body: isPushTokenPOSTProps,
			authRequired: true,
		},
		async function action() {
			const { id, type, value, appName, voipToken } = this.bodyParams;

			if (voipToken && !id) {
				return API.v1.failure('voip-tokens-must-specify-device-id');
			}

			const rawToken = this.request.headers.get('x-auth-token');
			if (!rawToken) {
				throw new Meteor.Error('error-authToken-param-not-valid', 'The required "authToken" header param is missing or invalid.');
			}
			const authToken = Accounts._hashLoginToken(rawToken);

			const result = await Push.registerPushToken({
				...(id && { _id: id }),
				token: { [type]: value } as IPushToken['token'],
				authToken,
				appName,
				userId: this.userId,
				...(voipToken && { voipToken }),
			});

			return API.v1.success({ result: cleanTokenResult(result) });
		},
	)
	.delete(
		'push.token',
		{
			response: {
				200: ajv.compile<void>({
					additionalProperties: false,
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
						},
					},
					required: ['success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				404: validateNotFoundErrorResponse,
			},
			body: isPushTokenDELETEProps,
			authRequired: true,
		},
		async function action() {
			const { token } = this.bodyParams;

			const removeResult = await PushToken.removeAllByTokenStringAndUserId(token, this.userId);

			if (removeResult.deletedCount === 0) {
				return API.v1.notFound();
			}

			return API.v1.success();
		},
	);

API.v1.addRoute(
	'push.get',
	{ authRequired: true },
	{
		async get() {
			const params = this.queryParams;
			check(
				params,
				Match.ObjectIncluding({
					id: String,
				}),
			);

			const receiver = await Users.findOneById(this.userId);
			if (!receiver) {
				throw new Error('error-user-not-found');
			}

			const message = await Messages.findOneById(params.id);
			if (!message) {
				throw new Error('error-message-not-found');
			}

			const room = await Rooms.findOneById(message.rid);
			if (!room) {
				throw new Error('error-room-not-found');
			}

			if (!(await canAccessRoomAsync(room, receiver))) {
				throw new Error('error-not-allowed');
			}

			const data = await PushNotification.getNotificationForMessageId({ receiver, room, message });

			return API.v1.success({ data });
		},
	},
);

API.v1.addRoute(
	'push.info',
	{ authRequired: true },
	{
		async get() {
			const defaultGateway = (await Settings.findOneById('Push_gateway', { projection: { packageValue: 1 } }))?.packageValue;
			const defaultPushGateway = settings.get('Push_gateway') === defaultGateway;
			return API.v1.success({
				pushGatewayEnabled: settings.get('Push_enable'),
				defaultPushGateway,
			});
		},
	},
);

const pushTestEndpoints = API.v1.post(
	'push.test',
	{
		authRequired: true,
		rateLimiterOptions: {
			numRequestsAllowed: 1,
			intervalTimeInMS: 1000,
		},
		permissionsRequired: ['test-push-notifications'],
		body: ajv.compile<undefined>({ type: 'object', additionalProperties: false }),
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			200: ajv.compile<{ tokensCount: number }>({
				type: 'object',
				properties: {
					tokensCount: { type: 'integer' },
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['tokensCount', 'success'],
				additionalProperties: false,
			}),
		},
	},

	async function action() {
		if (settings.get('Push_enable') !== true) {
			throw new Meteor.Error('error-push-disabled', 'Push is disabled', {
				method: 'push_test',
			});
		}

		const tokensCount = await executePushTest(this.userId, this.user.username);
		return API.v1.success({ tokensCount });
	},
);

type PushTestEndpoints = ExtractRoutesFromAPI<typeof pushTestEndpoints>;

type PushTokenEndpoints = ExtractRoutesFromAPI<typeof pushTokenEndpoints>;

type PushEndpoints = PushTestEndpoints & PushTokenEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends PushEndpoints {}
}
