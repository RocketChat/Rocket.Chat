import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.authz.roomAccessValidators = [
	function(room, user = {}) {
		if (room && room.t === 'c') {
			if (!user._id && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
				return true;
			}

			return RocketChat.authz.hasPermission(user._id, 'view-c-room');
		}
	},
	function(room, user) {
		if (!room || !user) {
			return;
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
		if (subscription) {
			return true;
		}
	},
];

RocketChat.authz.canAccessRoom = function(room, user, extraData) {
	return RocketChat.authz.roomAccessValidators.some((validator) => validator(room, user, extraData));
};

RocketChat.authz.addRoomAccessValidator = function(validator) {
	RocketChat.authz.roomAccessValidators.push(validator.bind(this));
};
