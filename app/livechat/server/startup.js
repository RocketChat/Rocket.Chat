import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { roomTypes } from '../../utils';
import { Rooms } from '../../models';
import { hasPermission, addRoomAccessValidator } from '../../authorization';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { LivechatInquiry } from '../lib/LivechatInquiry';

Meteor.startup(() => {
	roomTypes.setRoomFind('l', (_id) => Rooms.findOneLivechatById(_id));

	addRoomAccessValidator(function(room, user) {
		return room && room.t === 'l' && user && hasPermission(user._id, 'view-livechat-rooms');
	});

	addRoomAccessValidator(function(room, user, extraData) {
		if (!room && extraData && extraData.rid) {
			room = Rooms.findOneById(extraData.rid);
		}
		return room && room.t === 'l' && extraData && extraData.visitorToken && room.v && room.v.token === extraData.visitorToken;
	});

	addRoomAccessValidator(function(room, user) {
		if (settings.get('Livechat_Routing_Method') !== 'Guest_Pool') {
			return;
		}

		if (!user || !room || room.t !== 'l') {
			return;
		}

		const inquiry = LivechatInquiry.findOne({ agents: user._id, rid: room._id }, { fields: { status: 1 } });
		return inquiry && inquiry.status === 'open';
	});

	callbacks.add('beforeLeaveRoom', function(user, room) {
		if (room.t !== 'l') {
			return user;
		}
		throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
			lng: user.language || settings.get('Language') || 'en',
		}));
	}, callbacks.priority.LOW, 'cant-leave-room');
});
