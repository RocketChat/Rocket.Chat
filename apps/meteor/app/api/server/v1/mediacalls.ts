import { MediaCall } from '@rocket.chat/core-services';
import { isMediaCallsStartProps, isMediaCallsSignalProps } from '@rocket.chat/rest-typings';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { API } from '../api';

API.v1.addRoute(
	'media-calls.start',
	{ authRequired: true, validateParams: isMediaCallsStartProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 } },
	{
		async post() {
			const { roomId, sessionId } = this.bodyParams;
			const { userId } = this;
			if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			if (!(await hasPermissionAsync(userId, 'call-management', roomId))) {
				return API.v1.forbidden();
			}

			try {
				const call = await MediaCall.callRoom({ uid: userId, sessionId }, roomId);

				return API.v1.success({
					call,
				});
			} catch (e) {
				return API.v1.failure('error');
			}
		},
	},
);

API.v1.addRoute(
	'media-calls.signal',
	{ authRequired: true, validateParams: isMediaCallsSignalProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 } },
	{
		async post() {
			const { signal } = this.bodyParams;
			const { userId } = this;

			// if (!(await hasPermissionAsync(userId, 'call-management', roomId))) {
			// 	return API.v1.forbidden();
			// }

			try {
				await MediaCall.processSignal(signal, userId);

				return API.v1.success();
			} catch (e) {
				return API.v1.failure('error');
			}
		},
	},
);
