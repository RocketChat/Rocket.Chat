RocketChat.Notifications = new class {
	constructor() {
		this.debug = false;
		this.streamAll = new Meteor.Streamer('notify-all');
		this.streamLogged = new Meteor.Streamer('notify-logged');
		this.streamRoom = new Meteor.Streamer('notify-room');
		this.streamRoomUsers = new Meteor.Streamer('notify-room-users');
		this.streamUser = new Meteor.Streamer('notify-user');
		this.streamAll.allowWrite('none');
		this.streamLogged.allowWrite('none');
		this.streamRoom.allowWrite('none');
		this.streamRoomUsers.allowWrite(function(eventName, ...args) {
			const [roomId, e] = eventName.split('/');
			// const user = Meteor.users.findOne(this.userId, {
			// 	fields: {
			// 		username: 1
			// 	}
			// });
			if (RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
				const subscriptions = RocketChat.models.Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
				subscriptions.forEach(subscription => RocketChat.Notifications.notifyUser(subscription.u._id, e, ...args));
			}
			return false;
		});
		this.streamUser.allowWrite('logged');
		this.streamAll.allowRead('all');
		this.streamLogged.allowRead('logged');
		this.streamRoom.allowRead(function(eventName) {
			if (this.userId == null) {
				return false;
			}
			const [roomId] = eventName.split('/');
			const user = Meteor.users.findOne(this.userId, {
				fields: {
					username: 1
				}
			});
			const room = RocketChat.models.Rooms.findOneById(roomId);
			if (!room) {
				console.warn(`Invalid streamRoom eventName: "${ eventName }"`);
				return false;
			}
			if (room.t === 'l' && room.v._id === user._id) {
				return true;
			}
			return room.usernames.indexOf(user.username) > -1;
		});
		this.streamRoomUsers.allowRead('none');
		this.streamUser.allowRead(function(eventName) {
			const [userId] = eventName.split('/');
			return (this.userId != null) && this.userId === userId;
		});
	}

	notifyAll(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyAll', arguments);
		}
		args.unshift(eventName);
		return this.streamAll.emit.apply(this.streamAll, args);
	}

	notifyLogged(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyLogged', arguments);
		}
		args.unshift(eventName);
		return this.streamLogged.emit.apply(this.streamLogged, args);
	}

	notifyRoom(room, eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyRoom', arguments);
		}
		args.unshift(`${ room }/${ eventName }`);
		return this.streamRoom.emit.apply(this.streamRoom, args);
	}

	notifyUser(userId, eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyUser', arguments);
		}
		args.unshift(`${ userId }/${ eventName }`);
		return this.streamUser.emit.apply(this.streamUser, args);
	}

	notifyAllInThisInstance(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyAll', arguments);
		}
		args.unshift(eventName);
		return this.streamAll.emitWithoutBroadcast.apply(this.streamAll, args);
	}

	notifyLoggedInThisInstance(eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyLogged', arguments);
		}
		args.unshift(eventName);
		return this.streamLogged.emitWithoutBroadcast.apply(this.streamLogged, args);
	}

	notifyRoomInThisInstance(room, eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyRoomAndBroadcast', arguments);
		}
		args.unshift(`${ room }/${ eventName }`);
		return this.streamRoom.emitWithoutBroadcast.apply(this.streamRoom, args);
	}

	notifyUserInThisInstance(userId, eventName, ...args) {
		if (this.debug === true) {
			console.log('notifyUserAndBroadcast', arguments);
		}
		args.unshift(`${ userId }/${ eventName }`);
		return this.streamUser.emitWithoutBroadcast.apply(this.streamUser, args);
	}
};

RocketChat.Notifications.streamRoom.allowWrite(function(eventName, username) {
	const [, e] = eventName.split('/');
	if (e === 'webrtc') {
		return true;
	}
	if (e === 'typing') {
		const user = Meteor.users.findOne(this.userId, {
			fields: {
				username: 1
			}
		});
		if (user != null && user.username === username) {
			return true;
		}
	}
	return false;
});
