import type { IAppsTokens } from '@rocket.chat/core-typings';
import { Messages, AppsTokens, Users, Rooms, Settings } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { executePushTest } from '../../../../server/lib/pushConfig';
import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import { pushUpdate } from '../../../push/server/methods';
import PushNotification from '../../../push-notifications/server/lib/PushNotification';
import { settings } from '../../../settings/server';
import { API } from '../api';

API.v1.addRoute(
	'push.token',
	{ authRequired: true },
	{
		async post() {
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
		async delete() {
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
