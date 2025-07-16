import { Settings, Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { throttledCounter } from '../../../../lib/utils/throttledCounter';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { settings } from '../../../settings/server';

const incException = throttledCounter((counter) => {
	Settings.incrementValueById('Uncaught_Exceptions_Count', counter, { returnDocument: 'after' })
		.then((value) => {
			if (value) {
				settings.set(value);
			}
		})
		.catch(console.error);
}, 10000);

class ErrorHandler {
	reporting: boolean;

	rid: string | null;

	lastError: string | null;

	constructor() {
		this.reporting = false;
		this.rid = null;
		this.lastError = null;
	}

	async getRoomId(roomName: string): Promise<string | null> {
		if (!roomName) {
			return null;
		}
		const room = await Rooms.findOneByName(roomName.replace('#', ''), { projection: { _id: 1, t: 1 } });
		if (!room || (room.t !== 'c' && room.t !== 'p')) {
			return null;
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

const errorHandler = new ErrorHandler();

Meteor.startup(async () => {
	settings.watch<string>('Log_Exceptions_to_Channel', async (value) => {
		errorHandler.rid = null;
		const roomName = value.trim();

		const rid = await errorHandler.getRoomId(roomName);

		errorHandler.reporting = Boolean(rid);
		errorHandler.rid = rid;
	});
});

// eslint-disable-next-line @typescript-eslint/no-this-alias
const originalMeteorDebug = Meteor._debug;

Meteor._debug = function (message, stack, ...args) {
	if (!errorHandler.reporting) {
		return originalMeteorDebug.call(this, message, stack);
	}
	void errorHandler.trackError(message, stack);
	return originalMeteorDebug.apply(this, [message, stack, ...args]);
};

/**
 * If some promise is rejected and doesn't have a catch (unhandledRejection) it may cause this finally
 * here https://github.com/meteor/meteor/blob/be6e529a739f47446950e045f4547ee60e5de7ae/packages/mongo/oplog_tailing.js#L348
 * to not be executed never ending the oplog worker and freezing the entire process.
 *
 * The only way to release the process is executing the following code via inspect:
 *   MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle._workerActive = false
 *
 * Since unhandled rejections are deprecated in NodeJS:
 * (node:83382) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections
 * that are not handled will terminate the Node.js process with a non-zero exit code.
 * we will start respecting this and exit the process to prevent these kind of problems.
 */

process.on('unhandledRejection', (error) => {
	incException();

	if (error instanceof Error) {
		void errorHandler.trackError(error.message, error.stack);
	}

	console.error('=== UnHandledPromiseRejection ===');
	console.error(error);
	console.error('---------------------------------');
	console.error('Errors like this can cause oplog processing errors.');
	console.error(
		'Setting EXIT_UNHANDLEDPROMISEREJECTION will cause the process to exit allowing your service to automatically restart the process',
	);
	console.error('Future node.js versions will automatically exit the process');
	console.error('=================================');

	if (process.env.TEST_MODE || process.env.NODE_ENV === 'development' || process.env.EXIT_UNHANDLEDPROMISEREJECTION) {
		process.exit(1);
	}
});

process.on('uncaughtException', async (error) => {
	incException();

	console.error('=== UnCaughtException ===');
	console.error(error);
	console.error('-------------------------');
	console.error('Errors like this can cause oplog processing errors.');
	console.error('===========================');

	void errorHandler.trackError(error.message, error.stack);

	if (process.env.TEST_MODE || process.env.NODE_ENV === 'development' || process.env.EXIT_UNHANDLEDPROMISEREJECTION) {
		process.exit(1);
	}
});
