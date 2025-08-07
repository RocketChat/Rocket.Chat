import { MediaCall } from '@rocket.chat/core-services';
import { isMediaCallsSignalProps } from '@rocket.chat/rest-typings';

import { API } from '../api';

API.v1.addRoute(
	'media-calls.signal',
	{ authRequired: true, validateParams: isMediaCallsSignalProps, rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 } },
	{
		async post() {
			const { signal } = this.bodyParams;
			const { userId } = this;

			// if (!(await hasPermissionAsync(userId, 'call-management', roomId))) {
			// 	return API.v1.forbidden();
			// }

			try {
				await MediaCall.processSignal(userId, signal);

				return API.v1.success();
			} catch (e) {
				return API.v1.failure('error');
			}
		},
	},
);
