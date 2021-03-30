import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../../../../app/api/server';
import { hasPermission } from '../../../../../app/authorization';
import { Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';


API.v1.addRoute('livechat/room.onHold', { authRequired: true }, {
	post() {
		const { roomId } = this.bodyParams;
		if (!roomId || roomId.trim() === '') {
			return API.v1.failure('Invalid room Id');
		}

		if (!this.userId || !hasPermission(this.userId, 'on-hold-livechat-room')) {
			return API.v1.failure('Not authorized');
		}

		const room = LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			return API.v1.failure('Invalid room Id');
		}

		if (room.onHold) {
			return API.v1.failure('Room is already On-Hold');
		}

		const user = Meteor.user();

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !hasPermission(this.userId, 'on-hold-others-livechat-room')) {
			return API.v1.failure('Not authorized');
		}

		const onHoldBy = { _id: user._id, username: user.username, name: user.name };
		const comment = TAPi18n.__('Livechat_On_Hold_manually', { user: onHoldBy.name || `@${ onHoldBy.username }` });

		LivechatEnterprise.placeRoomOnHold(room, comment, onHoldBy);

		return API.v1.success();
	},
});
