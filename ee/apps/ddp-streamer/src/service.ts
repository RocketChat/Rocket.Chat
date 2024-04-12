import { api } from '@rocket.chat/core-services';
import { db, trash } from '@rocket.chat/models';
import type { Document } from 'mongodb';

import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';

(async () => {
	const mongoDatabase = await getConnection();

	const trashCollection = await getCollection<Document>(Collections.Trash);

	db.register(mongoDatabase);

	trash.register(trashCollection);

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
