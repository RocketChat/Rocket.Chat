import type { IAppsTokens } from '@rocket.chat/core-typings';
import { Messages, AppsTokens, Users, Rooms, Settings } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import {
	ajv,
	validateNotFoundErrorResponse,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import type { JSONSchemaType } from 'ajv';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { executePushTest } from '../../../../server/lib/pushConfig';
import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import { pushUpdate } from '../../../push/server/methods';
import PushNotification from '../../../push-notifications/server/lib/PushNotification';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import type { SuccessResult } from '../definition';

type PushTokenPOST = {
	id?: string;
	type: 'apn' | 'gcm';
	value: string;
	appName: string;
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

const pushTokenEndpoints = API.v1
	.post(
		'push.token',
		{
			response: {
				200: ajv.compile<SuccessResult<{ result: Omit<IAppsTokens, '_updatedAt'> }>['body']>({
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
								authToken: {
									type: 'string',
								},
								appName: {
									type: 'string',
								},
								userId: {
									type: 'string',
									nullable: true,
								},
								metadata: {
									type: 'object',
									additionalProperties: true,
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
							},
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
			const { id, type, value, appName } = this.bodyParams;

			if (id && typeof id !== 'string') {
				throw new Meteor.Error('error-id-param-not-valid', 'The required "id" body param is invalid.');
			}

			const deviceId = id || Random.id();

			if (!type || (type !== 'apn' && type !== 'gcm')) {
				throw new Meteor.Error('error-type-param-not-valid', 'The required "type" body param is missing or invalid.');
			}

			if (!value || typeof value !== 'string') {
				throw new Meteor.Error('error-token-param-not-valid', 'The required "value" body param is missing or invalid.');
			}

			if (!appName || typeof appName !== 'string') {
				throw new Meteor.Error('error-appName-param-not-valid', 'The required "appName" body param is missing or invalid.');
			}

			const authToken = this.request.headers.get('x-auth-token');
			if (!authToken) {
				throw new Meteor.Error('error-authToken-param-not-valid', 'The required "authToken" header param is missing or invalid.');
			}

			const result = await pushUpdate({
				id: deviceId,
				token: { [type]: value } as IAppsTokens['token'],
				authToken,
				appName,
				userId: this.userId,
			});

			return API.v1.success({ result });
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

			if (!token || typeof token !== 'string') {
				throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
			}

			const affectedRecords = (
				await AppsTokens.deleteMany({
					$or: [
						{
							'token.apn': token,
						},
						{
							'token.gcm': token,
						},
					],
					userId: this.userId,
				})
			).deletedCount;

			if (affectedRecords === 0) {
				return API.v1.notFound();
			}

			return API.v1.success();
		},
	);

type PushTokenEndpoints = ExtractRoutesFromAPI<typeof pushTokenEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends PushTokenEndpoints {}
}

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

API.v1.addRoute(
	'push.test',
	{
		authRequired: true,
		rateLimiterOptions: {
			numRequestsAllowed: 1,
			intervalTimeInMS: 1000,
		},
		permissionsRequired: ['test-push-notifications'],
	},
	{
		async post() {
			if (settings.get('Push_enable') !== true) {
				throw new Meteor.Error('error-push-disabled', 'Push is disabled', {
					method: 'push_test',
				});
			}

			const tokensCount = await executePushTest(this.userId, this.user.username);
			return API.v1.success({ tokensCount });
		},
	},
);
