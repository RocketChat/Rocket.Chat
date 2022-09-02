/* eslint-disable no-unreachable */
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import { isLiveChatRoomSaveInfoProps } from '@rocket.chat/rest-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { API } from '../../../../api/server';
import { hasPermission } from '../../../../authorization/server';
import { Livechat } from '../../lib/Livechat';

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

			return API.v1.success({});
		},
	},
);
