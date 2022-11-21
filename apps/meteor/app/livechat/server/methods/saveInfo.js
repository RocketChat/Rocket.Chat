import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { hasPermission } from '../../../authorization';
import { LivechatRooms } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

/**
 * @deprecated Will be removed in future versions.
 */
Meteor.methods({
	async 'livechat:saveInfo'(guestData, roomData) {
		methodDeprecationLogger.warn(
			'livechat:saveInfo method will be deprecated in future versions of Rocket.Chat. Use "livechat/room.saveInfo" endpoint instead.',
		);
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveInfo' });
		}

		check(
			guestData,
			Match.ObjectIncluding({
				_id: String,
				name: Match.Optional(String),
				email: Match.Optional(String),
				phone: Match.Optional(String),
				livechatData: Match.Optional(Object),
			}),
		);

		check(
			roomData,
			Match.ObjectIncluding({
				_id: String,
				topic: Match.Optional(String),
				tags: Match.Optional([String]),
				livechatData: Match.Optional(Object),
				priorityId: Match.Optional(String),
			}),
		);

		const room = LivechatRooms.findOneById(roomData._id);
		if (!room || !isOmnichannelRoom(room)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:saveInfo' });
		}

		if ((!room.servedBy || room.servedBy._id !== userId) && !hasPermission(userId, 'save-others-livechat-room-info')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveInfo' });
		}

		if (room.sms) {
			delete guestData.phone;
		}

		await Promise.allSettled([Livechat.saveGuest(guestData), Livechat.saveRoomInfo(roomData)]);

		const user = Meteor.users.findOne({ _id: userId }, { fields: { _id: 1, username: 1 } });

		Meteor.defer(() => {
			callbacks.run('livechat.saveInfo', LivechatRooms.findOneById(roomData._id), {
				user,
				oldRoom: room,
			});
		});

		return true;
	},
});
