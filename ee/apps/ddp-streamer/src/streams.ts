import type { Document } from 'mongodb';

import { NotificationsModule } from '../../../../apps/meteor/server/modules/notifications/notifications.module';
import { Stream } from './Streamer';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

export const notifications = new NotificationsModule(Stream);

getConnection().then(async (db) => {
	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	notifications.configure();
});
