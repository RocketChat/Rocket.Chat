import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { roomTypes } from 'meteor/rocketchat:utils';
import { Rooms } from 'meteor/rocketchat:models';
import { hasPermission, addRoomAccessValidator } from 'meteor/rocketchat:authorization';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { settings } from 'meteor/rocketchat:settings';

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
			lng: user.language || settings.get('language') || 'en',
		}));
	}, callbacks.priority.LOW, 'cant-leave-room');
});
