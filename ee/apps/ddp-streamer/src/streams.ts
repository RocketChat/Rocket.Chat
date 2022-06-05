import { NotificationsModule } from '../../../../apps/meteor/server/modules/notifications/notifications.module';
import { Stream } from './Streamer';
import { getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import '../../../../apps/meteor/server/models/Rooms';
import '../../../../apps/meteor/server/models/Subscriptions';
import '../../../../apps/meteor/server/models/Users';
import '../../../../apps/meteor/server/models/Settings';

export const notifications = new NotificationsModule(Stream);

getConnection().then(() => {
	notifications.configure();
});
