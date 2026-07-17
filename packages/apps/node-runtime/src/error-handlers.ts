import * as Messenger from '@rocket.chat/apps/base-runtime/dist/lib/messenger';

export default function registerErrorListeners() {
	process.on('uncaughtException', (error: Error, origin: 'uncaughtException' | 'unhandledRejection') => {
		Messenger.sendNotification({
			method: origin,
			params: [error.stack || error],
		});
	});
}
