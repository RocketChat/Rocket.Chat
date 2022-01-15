import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import './Presence';

class Notifications {
	constructor(...args) {
		this.logged = Meteor.userId() !== null;
		this.loginCb = [];
		Tracker.autorun(() => {
			if (Meteor.userId() !== null && this.logged === false) {
				this.loginCb.forEach((cb) => cb());
			}
			this.logged = Meteor.userId() !== null;
		});
		this.debug = false;
		this.streamAll = new Meteor.Streamer('notify-all');
		this.streamLogged = new Meteor.Streamer('notify-logged');
		this.streamRoom = new Meteor.Streamer('notify-room');
		this.streamRoomUsers = new Meteor.Streamer('notify-room-users');
		this.streamUser = new Meteor.Streamer('notify-user');

		if (this.debug === true) {
			this.onAll(function () {
				return console.log('RocketChat.Notifications: onAll', args);
			});
			this.onUser(function () {
				return console.log('RocketChat.Notifications: onAll', args);
			});
		}
	}

	onLogin(cb) {
		this.loginCb.push(cb);
		if (this.logged) {
			return cb();
		}
	}

	notifyRoom(room, eventName, ...args) {
		if (this.debug === true) {
			console.log('RocketChat.Notifications: notifyRoom', [room, eventName, ...args]);
		}
		args.unshift(`${room}/${eventName}`);
		return this.streamRoom.emit.apply(this.streamRoom, args);
	}

	notifyUser(userId, eventName, ...args) {
		if (this.debug === true) {
			console.log('RocketChat.Notifications: notifyUser', [userId, eventName, ...args]);
		}
		args.unshift(`${userId}/${eventName}`);
		return this.streamUser.emit.apply(this.streamUser, args);
	}

	notifyUsersOfRoom(room, eventName, ...args) {
		if (this.debug === true) {
			console.log('RocketChat.Notifications: notifyUsersOfRoom', [room, eventName, ...args]);
		}
		args.unshift(`${room}/${eventName}`);
		return this.streamRoomUsers.emit.apply(this.streamRoomUsers, args);
	}

	onAll(eventName, callback) {
		return this.streamAll.on(eventName, callback);
	}

	onLogged(eventName, callback) {
		return this.onLogin(() => this.streamLogged.on(eventName, callback));
	}

	onRoom(room, eventName, callback) {
		if (this.debug === true) {
			this.streamRoom.on(room, function () {
				return console.log(`RocketChat.Notifications: onRoom ${room}`, [room, eventName, callback]);
			});
		}
		return this.streamRoom.on(`${room}/${eventName}`, callback);
	}

	async onUser(eventName, callback, visitorId = null) {
		await this.streamUser.on(`${Meteor.userId() || visitorId}/${eventName}`, callback);
		return () => this.unUser(eventName, callback, visitorId);
	}

	unAll(callback) {
		return this.streamAll.removeListener('notify', callback);
	}

	unLogged(callback) {
		return this.streamLogged.removeListener('notify', callback);
	}

	unRoom(room, eventName, callback) {
		return this.streamRoom.removeListener(`${room}/${eventName}`, callback);
	}

	unUser(eventName, callback, visitorId = null) {
		return this.streamUser.removeListener(`${Meteor.userId() || visitorId}/${eventName}`, callback);
	}
}

export default new Notifications();
