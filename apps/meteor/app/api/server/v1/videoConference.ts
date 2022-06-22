import { VideoConference } from '@rocket.chat/core-typings';
import {
	isVideoConfStartProps,
	isVideoConfJoinProps,
	isVideoConfCancelProps,
	isVideoConfInfoProps,
	isVideoConfListProps,
} from '@rocket.chat/rest-typings';

import { API } from '../api';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { VideoConf } from '../../../../server/sdk';
import { videoConfProviders } from '../../../../server/lib/videoConfProviders';

API.v1.addRoute(
	'video-conference.start',
	{ authRequired: true, validateParams: isVideoConfStartProps },
	{
		async post() {
			const { roomId, title } = this.bodyParams;
			const { userId } = this;
			if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			try {
				const providerName = videoConfProviders.getActiveProvider();

				if (!providerName) {
					throw new Error('no-active-video-conf-provider');
				}

				return API.v1.success({
					data: {
						...(await VideoConf.start(userId, roomId, title)),
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
	{ authRequired: true, validateParams: isVideoConfJoinProps },
	{
		async post() {
			const { callId, state } = this.bodyParams;
			const { userId } = this;

			const call = await VideoConf.get(callId);
			if (!call) {
				return API.v1.failure('invalid-params');
			}

			if (!userId || !(await canAccessRoomIdAsync(call.rid, userId))) {
				return API.v1.failure('invalid-params');
			}

			try {
				return API.v1.success({
					url: await VideoConf.join(userId, callId, {
						...(state?.cam !== undefined ? { cam: state.cam } : {}),
						...(state?.mic !== undefined ? { mic: state.mic } : {}),
					}),
					providerName: call.providerName,
				});
			} catch (e) {
				return API.v1.failure(await VideoConf.diagnoseProvider(userId, call.rid, call.providerName));
			}
		},
	},
);

API.v1.addRoute(
	'video-conference.cancel',
	{ authRequired: true, validateParams: isVideoConfCancelProps },
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
	{ authRequired: true, validateParams: isVideoConfInfoProps },
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

			return API.v1.success(call as VideoConference);
		},
	},
);

API.v1.addRoute(
	'video-conference.list',
	{ authRequired: true, validateParams: isVideoConfListProps },
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
	{ authRequired: true },
	{
		async get() {
			const data = await VideoConf.listProviders();

			return API.v1.success({ data });
		},
	},
);

API.v1.addRoute(
	'video-conference.capabilities',
	{ authRequired: true },
	{
		async get() {
			const data = await VideoConf.listCapabilities();

			return API.v1.success(data);
		},
	},
);
