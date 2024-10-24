import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { broker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';

import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

(async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'ddp-streamer', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(broker);

	// need to import service after models are registered
	const { NotificationsModule } = await import('../../../../apps/meteor/server/modules/notifications/notifications.module');
	const { DDPStreamer } = await import('./DDPStreamer');
	const { Stream } = await import('./Streamer');

	const notifications = new NotificationsModule(Stream);

	notifications.configure();

	api.registerService(new DDPStreamer(notifications));

	await api.start();
})();
