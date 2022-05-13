import type { ISubscription, IRoom, IUser, ISetting } from '@rocket.chat/core-typings';

import { NotificationsModule } from '../../../../apps/meteor/server/modules/notifications/notifications.module';
import { Stream } from './Streamer';
import { Collections, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { RoomsRaw } from '../../../../apps/meteor/app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../../apps/meteor/app/models/server/raw/Subscriptions';
import { UsersRaw } from '../../../../apps/meteor/app/models/server/raw/Users';
import { SettingsRaw } from '../../../../apps/meteor/app/models/server/raw/Settings';

export const notifications = new NotificationsModule(Stream);

getConnection().then((db) => {
	const Users = new UsersRaw(db.collection<IUser>(Collections.User));
	notifications.configure({
		Rooms: new RoomsRaw(db.collection<IRoom>(Collections.Rooms)),
		Subscriptions: new SubscriptionsRaw(db.collection<ISubscription>(Collections.Subscriptions), {
			Users,
		}),
		Users,
		Settings: new SettingsRaw(db.collection<ISetting>(Collections.Settings)),
	});
});
