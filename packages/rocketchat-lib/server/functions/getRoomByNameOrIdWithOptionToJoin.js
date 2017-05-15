/* globals RocketChat */
RocketChat.getRoomByNameOrIdWithOptionToJoin = function _getRoomByNameOrIdWithOptionToJoin({ currentUserId, nameOrId, type='', tryDirectByUserIdOnly=false, joinChannel=true, errorOnEmpty=true }) {
	let room;

	//If the nameOrId starts with #, then let's try to find a channel or group
	if (nameOrId.startsWith('#')) {
		nameOrId = nameOrId.substring(1);
		room = RocketChat.models.Rooms.findOneByIdOrName(nameOrId);
	} else if (nameOrId.startsWith('@') || type === 'd') {
		//If the nameOrId starts with @ OR type is 'd', then let's try just a direct message
		nameOrId = nameOrId.replace('@', '');

		let roomUser;
		if (tryDirectByUserIdOnly) {
			roomUser = RocketChat.models.Users.findOneById(nameOrId);
		} else {
			roomUser = RocketChat.models.Users.findOne({
				$or: [{ _id: nameOrId }, { username: nameOrId }]
			});
		}

		const rid = _.isObject(roomUser) ? [currentUserId, roomUser._id].sort().join('') : nameOrId;
		room = RocketChat.models.Rooms.findOneById(rid);

		//If the room hasn't been found yet, let's try some more
		if (!_.isObject(room)) {
			//If the roomUser wasn't found, then there's no destination to point towards
			//so return out based upon errorOnEmpty
			if (!_.isObject(roomUser)) {
				if (errorOnEmpty) {
					throw new Meteor.Error('invalid-channel');
				} else {
					return;
				}
			}

			room = Meteor.runAsUser(currentUserId, function() {
				const {rid} = Meteor.call('createDirectMessage', roomUser.username);
				return RocketChat.models.Rooms.findOneById(rid);
			});
		}
	} else {
		//Otherwise, we'll treat this as a channel or group.
		room = RocketChat.models.Rooms.findOneByIdOrName(nameOrId);
	}

	//If no room was found, handle the room return based upon errorOnEmpty
	if (!room && errorOnEmpty) {
		throw new Meteor.Error('invalid-channel');
	} else if (!room) {
		return;
	}

	//If a room was found and they provided a type to search, then check
	//and if the type found isn't what we're looking for then handle
	//the return based upon errorOnEmpty
	if (type && room.t !== type) {
		if (errorOnEmpty) {
			throw new Meteor.Error('invalid-channel');
		} else {
			return;
		}
	}

	//If the room type is channel and joinChannel has been passed, try to join them
	//if they can't join the room, this will error out!
	if (room.t === 'c' && joinChannel) {
		const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, currentUserId);

		if (!sub) {
			Meteor.runAsUser(currentUserId, function() {
				return Meteor.call('joinRoom', room._id);
			});
		}
	}

	return room;
};
