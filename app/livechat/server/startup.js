import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { roomTypes } from '/app/utils';
import { Rooms } from '/app/models';
import { hasPermission, addRoomAccessValidator } from '/app/authorization';
import { callbacks } from '/app/callbacks';
import { settings } from '/app/settings';

Meteor.startup(() => {
	roomTypes.setRoomFind('l', (_id) => Rooms.findLivechatById(_id).fetch());

	addRoomAccessValidator(function(room, user) {
		return room && room.t === 'l' && user && hasPermission(user._id, 'view-livechat-rooms');
	});

	addRoomAccessValidator(function(room, user, extraData) {
		if (!room && extraData && extraData.rid) {
			room = Rooms.findOneById(extraData.rid);
		}
		return room && room.t === 'l' && extraData && extraData.visitorToken && room.v && room.v.token === extraData.visitorToken;
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
