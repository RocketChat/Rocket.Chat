import { Meteor } from 'meteor/meteor';
import { Settings, Users, Rooms } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { sendMessage } from '../../../lib/server';

class ErrorHandler {
	reporting: boolean;

	rid: string | null;

	lastError: string | null;

	constructor() {
		this.reporting = false;
		this.rid = null;
		this.lastError = null;

		Meteor.startup(async () => {
			await this.registerHandlers();

			settings.watch<string>('Log_Exceptions_to_Channel', async (value) => {
				this.rid = null;
				const roomName = value.trim();
				if (roomName) {
					const rid = await this.getRoomId(roomName);
					if (rid) {
						this.rid = rid;
					}
				}

				if (this.rid) {
					this.reporting = true;
				} else {
					this.reporting = false;
				}
			});
		});
	}

	async registerHandlers() {
		process.on('uncaughtException', async (error) => {
			await Settings.incrementValueById('Uncaught_Exceptions_Count');
			if (!this.reporting) {
				return;
			}
			await this.trackError(error.message, error.stack);
		});

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		const originalMeteorDebug = Meteor._debug;
		Meteor._debug = function (message, stack, ...args) {
			if (!self.reporting) {
				return originalMeteorDebug.call(this, message, stack);
			}
			void self.trackError(message, stack);
			return originalMeteorDebug.apply(this, [message, stack, ...args]);
		};
	}

	async getRoomId(roomName: string): Promise<string | undefined> {
		roomName = roomName.replace('#', '');
		const room = await Rooms.findOneByName(roomName, { projection: { _id: 1, t: 1 } });
		if (!room || (room.t !== 'c' && room.t !== 'p')) {
			return;
		}
		return room._id;
	}

	async trackError(message: string, stack?: string): Promise<void> {
		if (!this.reporting || !this.rid || this.lastError === message) {
			return;
		}
		this.lastError = message;
		const user = await Users.findOneById('rocket.cat');

		if (stack) {
			message = `${message}\n\`\`\`\n${stack}\n\`\`\``;
		}

		await sendMessage(user, { msg: message }, { _id: this.rid });
	}
}

export default new ErrorHandler();
