
/*
* Hide is a named function that will replace /hide commands
* @param {Object} message - The message object
*/
function Hide(command, params, item) {
	if (command !== 'hide' || !Match.test(params, String)) {
		return;
	}
	const room = params.trim();
	const user = Meteor.user();
	let rid;

	// if there is not a param, hide the current room
	if (room === '') {
		rid = item.rid;
	} else {
		const strippedRoom = room.replace(/#|@/, '');
		let roomObject;

		// find channel or direct message room
		if (room[0] === '#') {
			roomObject = RocketChat.models.Rooms.findOneByName(strippedRoom);
		} else if (room[0] === '@') {
			roomObject = RocketChat.models.Rooms.findOne({
				t: 'd',
				usernames: { $all: [user.username, strippedRoom] }
			});
		}

		if (roomObject) {
			rid = roomObject._id;
		} else {
			return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__('Room_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [room]
				}, user.language)
			});
		}

		if (!roomObject.usernames.includes(user.username)) {
			return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__('error-logged-user-not-in-room', {
					postProcess: 'sprintf',
					sprintf: [room]
				}, user.language)
			});
		}
	}

	Meteor.call('hideRoom', rid, error => {
		if (error) {
			return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__(error, null, user.language)
			});
		}
	});
}

RocketChat.slashCommands.add('hide', Hide, { description: 'Hide_given_room', params: '#room' });
