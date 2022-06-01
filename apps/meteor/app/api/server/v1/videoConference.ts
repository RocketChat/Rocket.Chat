import { VideoConference } from '@rocket.chat/core-typings';
import {
	isVideoConfStartProps,
	isVideoConfJoinProps,
	isVideoConfCancelProps,
	isVideoConfInfoProps,
	isVideoConfListProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/server';
import { API } from '../api';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { VideoConf } from '../../../../server/sdk';

API.v1.addRoute(
	'video-conference/jitsi.update-timeout',
	{ authRequired: true },
	{
		post() {
			const { roomId, joiningNow = true } = this.bodyParams;
			if (!roomId) {
				return API.v1.failure('The "roomId" parameter is required!');
			}

			const room = Rooms.findOneById(roomId, { fields: { _id: 1 } });
			if (!room) {
				return API.v1.failure('Room does not exist!');
			}

			const jitsiTimeout = Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:updateTimeout', roomId, Boolean(joiningNow)));
			return API.v1.success({ jitsiTimeout });
		},
	},
);

API.v1.addRoute(
	'video-conference.start',
	{ authRequired: true, validateParams: isVideoConfStartProps },
	{
		async post() {
			const { roomId, title } = this.bodyParams;

			// #ToDo: Validate if there is an active provider

			const { userId } = this;

			if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			return API.v1.success({
				data: await VideoConf.start(userId, roomId, title),
			});
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

			return API.v1.success({
				url: await VideoConf.join(userId, callId, {
					...(state?.cam !== undefined ? { cam: state.cam } : {}),
					...(state?.mic !== undefined ? { mic: state.mic } : {}),
				}),
			});
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
