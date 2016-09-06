/* globals RocketChat */
RocketChat.authz.roomAccessValidators = [
	function(room, user) {
		return room.usernames.indexOf(user.username) !== -1;
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
