import { NotificationsModule } from '../../../../apps/meteor/server/modules/notifications/notifications.module';
import { Stream } from './Streamer';
import { getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

export const notifications = new NotificationsModule(Stream);

getConnection().then(({ database, trash }) => {
	registerServiceModels(database, trash);

	notifications.configure();
});
