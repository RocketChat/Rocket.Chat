import { Meteor } from 'meteor/meteor';

class LivechatNotifications {
	constructor() {
		this.debug === false;
		this.streamRoom = new Meteor.Streamer('notify-room');
	}

	notifyRoom(room, eventName, ...args) {
		if (this.debug === true) {
			console.log('RocketChat.Apps.Notifications: notifyRoom', [room, eventName, ...args]);
		}
		args.unshift(`${ room }/${ eventName }`);
		return this.streamRoom.emit.apply(this.streamRoom, args);
	}

	onRoom(room, eventName, callback) {
		if (this.debug === true) {
			this.streamRoom.on(room, function() {
				return console.log(`RocketChat.Apps.Notifications: onRoom ${ room }`, [room, eventName, callback]);
			});
		}
		return this.streamRoom.on(`${ room }/${ eventName }`, callback);
	}

	unRoom(room, eventName, callback) {
		if (this.debug === true) {
			console.log(`RocketChat.Apps.Notifications: unRoom ${ room }`, [room, eventName, callback]);
		}
		return this.streamRoom.removeListener(`${ room }/${ eventName }`, callback);
	}
}

export default new LivechatNotifications();
