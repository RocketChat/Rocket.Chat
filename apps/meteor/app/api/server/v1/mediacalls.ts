import { MediaCall } from '@rocket.chat/core-services';
import type { IMediaCall } from '@rocket.chat/core-typings';
import { isMediaCallsStartProps, isMediaCallsSignalProps } from '@rocket.chat/rest-typings';

import { API } from '../api';

API.v1.addRoute(
	'media-calls.start',
	{ authRequired: true, validateParams: isMediaCallsStartProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 } },
	{
		async post() {
			const { contractId, identifier, identifierKind } = this.bodyParams;
			const { userId } = this;

			if (!userId) {
				return API.v1.failure('invalid-params');
			}

			// #ToDo: Validate access and permissions

			// if (!(await hasPermissionAsync(userId, 'call-management',  roomId))) {
			// 	return API.v1.forbidden();
			// }

			const caller = { uid: userId, contractId };

			const functions: Record<string, () => Promise<IMediaCall>> = {
				user: () => MediaCall.callUser(caller, identifier),
				extension: () => MediaCall.callExtension(caller, identifier),
			};
			const startFn = functions[identifierKind];

			if (!startFn) {
				return API.v1.failure('invalid-params');
			}

			try {
				const call = await startFn();

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
	{ authRequired: true, validateParams: isMediaCallsSignalProps, rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 } },
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
