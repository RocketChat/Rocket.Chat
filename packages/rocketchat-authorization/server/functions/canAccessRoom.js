/* globals RocketChat */
RocketChat.authz.roomAccessValidators = [
	function(room, user) {
		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
		if (subscription) {
			return subscription._room;
		}
	},
	function(room, user) {
		if (room.t === 'c') {
			return RocketChat.authz.hasPermission(user._id, 'view-c-room');
		}
	}
];

RocketChat.authz.canAccessRoom = function(room, user) {
	return RocketChat.authz.roomAccessValidators.some((validator) => {
		return validator.call(this, room, user);
	});
};

RocketChat.authz.addRoomAccessValidator = function(validator) {
	RocketChat.authz.roomAccessValidators.push(validator);
};
