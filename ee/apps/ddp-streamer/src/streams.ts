import type { IRoomsModel, ISettingsModel, ISubscriptionsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { NotificationsModule } from '../../../../apps/meteor/server/modules/notifications/notifications.module';
import { Stream } from './Streamer';
import { getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { RoomsRaw } from '../../../../apps/meteor/server/models/raw/Rooms';
import { SubscriptionsRaw } from '../../../../apps/meteor/server/models/raw/Subscriptions';
import { UsersRaw } from '../../../../apps/meteor/server/models/raw/Users';
import { SettingsRaw } from '../../../../apps/meteor/server/models/raw/Settings';

export const notifications = new NotificationsModule(Stream);

getConnection().then((db) => {
	registerModel('ISubscriptionsModel', new SubscriptionsRaw(db.collection('rocketchat_subscription')) as ISubscriptionsModel);
	registerModel('ISettingsModel', new SettingsRaw(db.collection('rocketchat_settings')) as ISettingsModel);
	registerModel('IRoomsModel', new RoomsRaw(db.collection('rocketchat_room')) as IRoomsModel);
	registerModel('IUsersModel', new UsersRaw(db.collection('users')) as IUsersModel);

	notifications.configure();
});
