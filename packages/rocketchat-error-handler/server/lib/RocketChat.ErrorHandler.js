import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

class ErrorHandler {
	constructor() {
		this.reporting = false;
		this.rid = null;
		this.lastError = null;

		Meteor.startup(() => {
			this.registerHandlers();

			RocketChat.settings.get('Log_Exceptions_to_Channel', (key, value) => {
				this.rid = null;
				const roomName = value.trim();
				if (roomName) {
					this.rid = this.getRoomId(roomName);
				}

				if (this.rid) {
					this.reporting = true;
				} else {
					this.reporting = false;
				}
			});
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
		Meteor._debug = function(message, stack, ...args) {
			if (!self.reporting) {
				return originalMeteorDebug.call(this, message, stack);
			}
			self.trackError(message, stack);
			return originalMeteorDebug.apply(this, [message, stack, ...args]);
		};
	}

	getRoomId(roomName) {
		roomName = roomName.replace('#');
		const room = RocketChat.models.Rooms.findOneByName(roomName, { fields: { _id: 1, t: 1 } });
		if (!room || (room.t !== 'c' && room.t !== 'p')) {
			return;
		}
		return room._id;
	}

	trackError(message, stack) {
		if (!this.reporting || !this.rid || this.lastError === message) {
			return;
		}
		this.lastError = message;
		const user = RocketChat.models.Users.findOneById('rocket.cat');

		if (stack) {
			message = `${ message }\n\`\`\`\n${ stack }\n\`\`\``;
		}

		RocketChat.sendMessage(user, { msg: message }, { _id: this.rid });
	}
}

RocketChat.ErrorHandler = new ErrorHandler;
