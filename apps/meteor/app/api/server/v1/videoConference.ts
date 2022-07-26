import type { VideoConference } from '@rocket.chat/core-typings';
import {
	isVideoConfStartProps,
	isVideoConfJoinProps,
	isVideoConfCancelProps,
	isVideoConfInfoProps,
	isVideoConfListProps,
} from '@rocket.chat/rest-typings';

import { API } from '../api';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { VideoConf } from '../../../../server/sdk';
import { videoConfProviders } from '../../../../server/lib/videoConfProviders';
import { availabilityErrors } from '../../../../lib/videoConference/constants';

API.v1.addRoute(
	'video-conference.start',
	{ authRequired: true, validateParams: isVideoConfStartProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 } },
	{
		async post() {
			const { roomId, title, allowRinging: requestRinging } = this.bodyParams;
			const { userId } = this;
			if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			try {
				const providerName = videoConfProviders.getActiveProvider();

				if (!providerName) {
					throw new Error(availabilityErrors.NOT_ACTIVE);
				}

				const allowRinging = Boolean(requestRinging) && (await hasPermissionAsync(userId, 'videoconf-ring-users'));

				return API.v1.success({
					data: {
						...(await VideoConf.start(userId, roomId, { title, allowRinging })),
						providerName,
					},
				});
			} catch (e) {
				return API.v1.failure(await VideoConf.diagnoseProvider(userId, roomId));
			}
		},
	},
);

API.v1.addRoute(
	'video-conference.join',
	{ authOrAnonRequired: true, validateParams: isVideoConfJoinProps, rateLimiterOptions: { numRequestsAllowed: 2, intervalTimeInMS: 5000 } },
	{
		async post() {
			const { callId, state } = this.bodyParams;
			const { userId } = this;

			const call = await VideoConf.get(callId);
			if (!call) {
				return API.v1.failure('invalid-params');
			}

			if (!(await canAccessRoomIdAsync(call.rid, userId))) {
				return API.v1.failure('invalid-params');
			}

			let url: string | undefined;

			try {
				url = await VideoConf.join(userId, callId, {
					...(state?.cam !== undefined ? { cam: state.cam } : {}),
					...(state?.mic !== undefined ? { mic: state.mic } : {}),
				});
			} catch (e) {
				if (userId) {
					return API.v1.failure(await VideoConf.diagnoseProvider(userId, call.rid, call.providerName));
				}
			}

			if (!url) {
				return API.v1.failure('failed-to-get-url');
			}

			return API.v1.success({
				url,
				providerName: call.providerName,
			});
		},
	},
);

API.v1.addRoute(
	'video-conference.cancel',
	{ authRequired: true, validateParams: isVideoConfCancelProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 } },
	{
		async post() {
			const { callId } = this.bodyParams;
			const { userId } = this;

			const call = await VideoConf.get(callId);
			if (!call) {
				return API.v1.failure('invalid-params');
			}

			if (!userId || !(await canAccessRoomIdAsync(call.rid, userId))) {
				return API.v1.failure('invalid-params');
			}

			await VideoConf.cancel(userId, callId);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'video-conference.info',
	{ authRequired: true, validateParams: isVideoConfInfoProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const { callId } = this.queryParams;
			const { userId } = this;

			const call = await VideoConf.get(callId);
			if (!call) {
				return API.v1.failure('invalid-params');
			}

			if (!userId || !(await canAccessRoomIdAsync(call.rid, userId))) {
				return API.v1.failure('invalid-params');
			}

			const capabilities = await VideoConf.listProviderCapabilities(call.providerName);

			return API.v1.success({
				...(call as VideoConference),
				capabilities,
			});
		},
	},
);

API.v1.addRoute(
	'video-conference.list',
	{ authRequired: true, validateParams: isVideoConfListProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const { roomId } = this.queryParams;
			const { userId } = this;

			const { offset, count } = this.getPaginationItems();

			if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			const data = await VideoConf.list(roomId, { offset, count });

			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'video-conference.providers',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const data = await VideoConf.listProviders();

			return API.v1.success({ data });
		},
	},
);

API.v1.addRoute(
	'video-conference.capabilities',
	{ authRequired: true, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const data = await VideoConf.listCapabilities();

			return API.v1.success(data);
		},
	},
);
