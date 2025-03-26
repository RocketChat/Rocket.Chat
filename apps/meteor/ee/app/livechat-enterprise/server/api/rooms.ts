import { OmnichannelEEService } from '@rocket.chat/core-services';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions } from '@rocket.chat/models';
import { isLivechatRoomOnHoldProps, isLivechatRoomResumeOnHoldProps, isPOSTLivechatRoomPriorityParams } from '@rocket.chat/rest-typings';

import { removePriorityFromRoom, updateRoomPriority } from './lib/priorities';
import { API } from '../../../../../app/api/server';
import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { i18n } from '../../../../../server/lib/i18n';

API.v1.addRoute(
	'livechat/room.onHold',
	{
		authRequired: true,
		permissionsRequired: ['on-hold-livechat-room'],
		validateParams: isLivechatRoomOnHoldProps,
		license: ['livechat-enterprise'],
	},
	{
		async post() {
			const { roomId } = this.bodyParams;

			type Room = Pick<IOmnichannelRoom, '_id' | 't' | 'open' | 'onHold' | 'u' | 'lastMessage' | 'servedBy'>;

			const room = await LivechatRooms.findOneById<Room>(roomId, {
				projection: { _id: 1, t: 1, open: 1, onHold: 1, u: 1, lastMessage: 1, servedBy: 1 },
			});
			if (!room) {
				throw new Error('error-invalid-room');
			}

			const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, { projection: { _id: 1 } });
			if (!subscription && !(await hasPermissionAsync(this.userId, 'on-hold-others-livechat-room'))) {
				throw new Error('Not_authorized');
			}

			const onHoldBy = { _id: this.userId, username: this.user.username, name: this.user.name };
			const comment = i18n.t('Omnichannel_On_Hold_manually', {
				user: onHoldBy.name || `@${onHoldBy.username}`,
			});

			await OmnichannelEEService.placeRoomOnHold(room, comment, this.user);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.resumeOnHold',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		validateParams: isLivechatRoomResumeOnHoldProps,
		license: ['livechat-enterprise'],
	},
	{
		async post() {
			const { roomId } = this.bodyParams;
			if (!roomId || roomId.trim() === '') {
				throw new Error('invalid-param');
			}

			type Room = Pick<IOmnichannelRoom, '_id' | 't' | 'open' | 'onHold' | 'servedBy' | 'u' | 'lastMessage'>;

			const room = await LivechatRooms.findOneById<Room>(roomId, {
				projection: { t: 1, open: 1, onHold: 1, servedBy: 1 },
			});
			if (!room) {
				throw new Error('error-invalid-room');
			}

			const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, { projection: { _id: 1 } });
			if (!subscription && !(await hasPermissionAsync(this.userId, 'on-hold-others-livechat-room'))) {
				throw new Error('Not_authorized');
			}

			const { name, username, _id: userId } = this.user;
			const onHoldBy = { _id: userId, username, name };
			const comment = i18n.t('Omnichannel_on_hold_chat_resumed_manually', {
				user: onHoldBy.name || `@${onHoldBy.username}`,
			});

			await OmnichannelEEService.resumeRoomOnHold(room, comment, this.user, true);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room/:rid/priority',
	{
		authRequired: true,
		validateParams: { POST: isPOSTLivechatRoomPriorityParams },
		permissionsRequired: {
			POST: { permissions: ['view-l-room'], operation: 'hasAny' },
			DELETE: { permissions: ['view-l-room'], operation: 'hasAny' },
		},
		license: ['livechat-enterprise'],
	},
	{
		async post() {
			const { rid } = this.urlParams;
			const { priorityId } = this.bodyParams;

			if (!this.user.username) {
				return API.v1.failure('Invalid user');
			}

			await updateRoomPriority(
				rid,
				{
					_id: this.user._id,
					name: this.user.name || '',
					username: this.user.username,
				},
				priorityId,
			);

			return API.v1.success();
		},
		async delete() {
			const { rid } = this.urlParams;

			if (!this.user.username) {
				return API.v1.failure('Invalid user');
			}

			await removePriorityFromRoom(rid, {
				_id: this.user._id,
				name: this.user.name || '',
				username: this.user.username,
			});

			return API.v1.success();
		},
	},
);
