class ErrorHandler {
	constructor() {
		this.reporting = false;
		this.room = null;
		this.errors = [];

		process.on('uncaughtException', function(error) {
			if (!this.reporting) {
				return;
			}
			this.trackError(error);
		});

		RocketChat.settings.onload('Log_Exceptions_to_Channel', (key, value) => {
			if (value.trim()) {
				this.reporting = true;
				this.room = this.getRoomId(value);
			} else {
				this.reporting = false;
				this.room = '';
			}
		});
	}

	getRoom(roomName) {
		roomName = roomName.replace('#');
		let room = RocketChat.models.Rooms.findOneByName(roomName);
		if (room && (room.t === 'c' || room.t === 'p')) {
			return room;
		} else {
			this.reporting = false;
		}
	}

	trackError(error) {
		if (this.reporting && this.room) {
			let user = RocketChat.models.Users.findOneById('rocket.cat');
			let message = JSON.stringify(error);
			RocketChat.sendMessage(user, message, this.room);
		}
	}
}

RocketChat.ErrorHandler = new ErrorHandler;

Meteor.methods({
	'testException': function() {
		console.log(RocketChat.ErrorHandler.This.Is.An.Exception);
	}
});
