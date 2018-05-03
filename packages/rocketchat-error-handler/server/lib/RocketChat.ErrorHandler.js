class ErrorHandler {
	constructor() {
		this.reporting = false;
		this.rid = null;
		this.lastError = null;

		this.registerHandlers();

		RocketChat.settings.get('Log_Exceptions_to_Channel', (key, value) => {
			if (value.trim()) {
				this.reporting = true;
				this.rid = this.getRoomId(value);
			} else {
				this.reporting = false;
				this.rid = '';
			}
		});
	}

	registerHandlers() {
		process.on('uncaughtException', Meteor.bindEnvironment((error) => {
			if (!this.reporting) {
				return;
			}
			this.trackError(error.message, error.stack);
		}));

		const self = this;
		const originalMeteorDebug = Meteor._debug;
		Meteor._debug = function(message, stack) {
			if (!self.reporting) {
				return originalMeteorDebug.call(this, message, stack);
			}
			self.trackError(message, stack);
			return originalMeteorDebug.apply(this, arguments);
		};
	}

	getRoomId(roomName) {
		roomName = roomName.replace('#');
		const room = RocketChat.models.Rooms.findOneByName(roomName, { fields: { _id: 1, t: 1 } });
		if (room && (room.t === 'c' || room.t === 'p')) {
			return room._id;
		} else {
			this.reporting = false;
		}
	}

	trackError(message, stack) {
		if (this.reporting && this.rid && this.lastError !== message) {
			this.lastError = message;
			const user = RocketChat.models.Users.findOneById('rocket.cat');

			if (stack) {
				message = `${ message }\n\`\`\`\n${ stack }\n\`\`\``;
			}

			RocketChat.sendMessage(user, { msg: message }, { _id: this.rid });
		}
	}
}

RocketChat.ErrorHandler = new ErrorHandler;
