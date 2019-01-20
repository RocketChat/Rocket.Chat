import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(() => {
	RocketChat.roomTypes.setRoomFind('l', (_id) => RocketChat.models.Rooms.findLivechatById(_id).fetch());

	RocketChat.authz.addRoomAccessValidator(function(room, user) {
		return room && room.t === 'l' && user && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
	});

	RocketChat.authz.addRoomAccessValidator(function(room, user, extraData) {
		if (!room && extraData && extraData.rid) {
			room = RocketChat.models.Rooms.findOneById(extraData.rid);
		}
		return room && room.t === 'l' && extraData && extraData.visitorToken && room.v && room.v.token === extraData.visitorToken;
	});

	RocketChat.callbacks.add('beforeLeaveRoom', function(user, room) {
		if (room.t !== 'l') {
			return user;
		}
		throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
			lng: user.language || RocketChat.settings.get('language') || 'en',
		}));
	}, RocketChat.callbacks.priority.LOW, 'cant-leave-room');
});
