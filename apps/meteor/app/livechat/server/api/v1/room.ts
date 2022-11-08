import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { ILivechatAgent, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users } from '@rocket.chat/models';
import {
	isLiveChatRoomForwardProps,
	isPOSTLivechatRoomCloseParams,
	isPOSTLivechatRoomTransferParams,
	isPOSTLivechatRoomSurveyParams,
	isLiveChatRoomJoinProps,
	isPUTLivechatRoomVisitorParams,
	isLiveChatRoomSaveInfoProps,
} from '@rocket.chat/rest-typings';

import { settings as rcSettings } from '../../../../settings/server';
import { Messages, LivechatRooms } from '../../../../models/server';
import { API } from '../../../../api/server';
import { findGuest, findRoom, getRoom, settings, findAgent, onCheckRoomParams } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { normalizeTransferredByData } from '../../lib/Helper';
import { findVisitorInfo } from '../lib/visitors';
import { canAccessRoom, hasPermission } from '../../../../authorization/server';
import { addUserToRoom } from '../../../../lib/server/functions';
import { apiDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';
import { deprecationWarning } from '../../../../api/server/helpers/deprecationWarning';
import { callbacks } from '../../../../../lib/callbacks';

const isAgentWithInfo = (agentObj: ILivechatAgent | { hiddenInfo: true }): agentObj is ILivechatAgent => !('hiddenInfo' in agentObj);

API.v1.addRoute('livechat/room', {
	async get() {
		// I'll temporary use check for validation, as validateParams doesnt support what's being done here
		const extraCheckParams = onCheckRoomParams({
			token: String,
			rid: Match.Maybe(String),
			agentId: Match.Maybe(String),
		});

		check(this.queryParams, extraCheckParams);

		const { token, rid: roomId, agentId, ...extraParams } = this.queryParams;

		const guest = token && (await findGuest(token));
		if (!guest) {
			throw new Error('invalid-token');
		}

		let room: IOmnichannelRoom;
		if (!roomId) {
			room = LivechatRooms.findOneOpenByVisitorToken(token, {});
			if (room) {
				return API.v1.success({ room, newRoom: false });
			}

			let agent;
			const agentObj = agentId && findAgent(agentId);
			if (agentObj) {
				if (isAgentWithInfo(agentObj)) {
					const { username = undefined } = agentObj;
					agent = { agentId, username };
				} else {
					agent = { agentId };
				}
			}

			const rid = Random.id();
			const roomInfo = {
				source: {
					type: this.isWidget() ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
				},
			};

			const newRoom = await getRoom({ guest, rid, agent, roomInfo, extraParams });
			return API.v1.success(newRoom);
		}

		room = LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, token, {});
		if (!room) {
			throw new Error('invalid-room');
		}

		return API.v1.success({ room, newRoom: false });
	},
});

API.v1.addRoute(
	'livechat/room.close',
	{ validateParams: isPOSTLivechatRoomCloseParams },
	{
		async post() {
			const { rid, token } = this.bodyParams;

			const visitor = await findGuest(token);
			if (!visitor) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			if (!room.open) {
				throw new Error('room-closed');
			}

			const language = rcSettings.get<string>('Language') || 'en';
			const comment = TAPi18n.__('Closed_by_visitor', { lng: language });

			// @ts-expect-error -- typings on closeRoom are wrong
			if (!Livechat.closeRoom({ visitor, room, comment })) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, comment });
		},
	},
);

API.v1.addRoute(
	'livechat/room.transfer',
	{ validateParams: isPOSTLivechatRoomTransferParams },
	{
		async post() {
			apiDeprecationLogger.warn('livechat/room.transfer has been deprecated. Use livechat/room.forward instead.');

			const { rid, token, department } = this.bodyParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			let room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			// update visited page history to not expire
			Messages.keepHistoryForToken(token);

			const { _id, username, name } = guest;
			const transferredBy = normalizeTransferredByData({ _id, username, name, userType: 'visitor' }, room);

			if (!(await Livechat.transfer(room, guest, { roomId: rid, departmentId: department, transferredBy }))) {
				return API.v1.failure();
			}

			room = findRoom(token, rid);
			return API.v1.success(
				deprecationWarning({
					endpoint: 'livechat/room.transfer',
					versionWillBeRemoved: '6.0',
					response: { room },
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/room.survey',
	{ validateParams: isPOSTLivechatRoomSurveyParams },
	{
		async post() {
			const { rid, token, data } = this.bodyParams;

			const visitor = await findGuest(token);
			if (!visitor) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			const config = await settings();
			if (!config.survey || !config.survey.items || !config.survey.values) {
				throw new Error('invalid-livechat-config');
			}

			const updateData: { [k: string]: string } = {};
			for (const item of data) {
				if ((config.survey.items.includes(item.name) && config.survey.values.includes(item.value)) || item.name === 'additionalFeedback') {
					updateData[item.name] = item.value;
				}
			}

			if (Object.keys(updateData).length === 0) {
				throw new Error('invalid-data');
			}

			if (!LivechatRooms.updateSurveyFeedbackById(room._id, updateData)) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, data: updateData });
		},
	},
);

API.v1.addRoute(
	'livechat/room.forward',
	{ authRequired: true, permissionsRequired: ['view-l-room', 'transfer-livechat-guest'], validateParams: isLiveChatRoomForwardProps },
	{
		async post() {
			const transferData: typeof this.bodyParams & {
				transferredBy?: unknown;
				transferredTo?: { _id: string; username?: string; name?: string };
			} = this.bodyParams;

			const room = await LivechatRooms.findOneById(this.bodyParams.roomId);
			if (!room || room.t !== 'l') {
				throw new Error('error-invalid-room');
			}

			if (!room.open) {
				throw new Error('This_conversation_is_already_closed');
			}

			const guest = await LivechatVisitors.findOneById(room.v?._id);
			transferData.transferredBy = normalizeTransferredByData(Meteor.user() || {}, room);
			if (transferData.userId) {
				const userToTransfer = await Users.findOneById(transferData.userId);
				if (userToTransfer) {
					transferData.transferredTo = {
						_id: userToTransfer._id,
						username: userToTransfer.username,
						name: userToTransfer.name,
					};
				}
			}

			const chatForwardedResult = await Livechat.transfer(room, guest, transferData);

			return chatForwardedResult ? API.v1.success() : API.v1.failure();
		},
	},
);

API.v1.addRoute(
	'livechat/room.visitor',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isPUTLivechatRoomVisitorParams },
	{
		async put() {
			// This endpoint is deprecated and will be removed in future versions.
			const { rid, newVisitorId, oldVisitorId } = this.bodyParams;

			const { visitor } = await findVisitorInfo({ visitorId: newVisitorId });
			if (!visitor) {
				throw new Error('invalid-visitor');
			}

			let room = LivechatRooms.findOneById(rid, { _id: 1, v: 1 }); // TODO: check _id
			if (!room) {
				throw new Error('invalid-room');
			}

			const { v: { _id: roomVisitorId = undefined } = {} } = room; // TODO: v it will be undefined
			if (roomVisitorId !== oldVisitorId) {
				throw new Error('invalid-room-visitor');
			}

			room = Livechat.changeRoomVisitor(this.userId, rid, visitor);

			return API.v1.success(deprecationWarning({ endpoint: 'livechat/room.visitor', versionWillBeRemoved: '6.0', response: { room } }));
		},
	},
);

API.v1.addRoute(
	'livechat/room.join',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLiveChatRoomJoinProps },
	{
		async get() {
			const { roomId } = this.queryParams;

			const { user } = this;

			if (!user) {
				throw new Error('error-invalid-user');
			}

			const room = LivechatRooms.findOneById(roomId);

			if (!room) {
				throw new Error('error-invalid-room');
			}

			if (!canAccessRoom(room, user)) {
				throw new Error('error-not-allowed');
			}

			addUserToRoom(roomId, user);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.saveInfo',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLiveChatRoomSaveInfoProps },
	{
		async post() {
			const { roomData, guestData } = this.bodyParams;
			const room = await LivechatRooms.findOneById(roomData._id);
			if (!room || !isOmnichannelRoom(room)) {
				throw new Error('error-invalid-room');
			}

			if ((!room.servedBy || room.servedBy._id !== this.userId) && !hasPermission(this.userId, 'save-others-livechat-room-info')) {
				return API.v1.unauthorized();
			}

			if (room.sms) {
				delete guestData.phone;
			}

			await Promise.allSettled([Livechat.saveGuest(guestData, this.userId), Livechat.saveRoomInfo(roomData)]);

			callbacks.run('livechat.saveInfo', LivechatRooms.findOneById(roomData._id), {
				user: this.user,
				oldRoom: room,
			});

			return API.v1.success();
		},
	},
);
