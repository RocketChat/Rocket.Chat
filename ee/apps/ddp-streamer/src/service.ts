import os from 'os';

import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';

(async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'ddp-streamer', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(
		startBroker({
			nodeID: `${os.hostname().toLowerCase()}-${InstanceStatus.id()}`,
		}),
	);

	// need to import service after models are registered
	const { NotificationsModule } = await import('../../../../apps/meteor/server/modules/notifications/notifications.module');
	const { DDPStreamer } = await import('./DDPStreamer');
	const { Stream } = await import('./Streamer');

	const notifications = new NotificationsModule(Stream);

	notifications.configure();

	api.registerService(new DDPStreamer(notifications));

	await api.start();
})();

/**
 * If some promise is rejected and doesn't have a catch (unhandledRejection) it may cause the process to exit.
 *
 * Since unhandled rejections are deprecated in NodeJS:
 * (node:83382) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections
 * that are not handled will terminate the Node.js process with a non-zero exit code.
 * we will start respecting this and exit the process to prevent these kind of problems.
 */

process.on('unhandledRejection', (error) => {
	console.error('=== UnHandledPromiseRejection ===');
	console.error(error);
	console.error('---------------------------------');
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
	console.error('=== UnCaughtException ===');
	console.error(error);
	console.error('-------------------------');
	console.error('Errors like this can cause oplog processing errors.');
	console.error('===========================');

	if (process.env.TEST_MODE || process.env.NODE_ENV === 'development' || process.env.EXIT_UNHANDLEDPROMISEREJECTION) {
		process.exit(1);
	}
});
