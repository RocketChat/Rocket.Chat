import { Stream } from '../Streamer';
import { NotificationsModule } from '../../../../../server/modules/notifications/notifications.module';
import type { ISubscription } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import type { ISetting } from '@rocket.chat/core-typings';
import { Collections, getConnection } from '../../mongo';
import { RoomsRaw } from '../../../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../../../app/models/server/raw/Subscriptions';
import { UsersRaw } from '../../../../../app/models/server/raw/Users';
import { SettingsRaw } from '../../../../../app/models/server/raw/Settings';

const notifications = new NotificationsModule(Stream);

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

export default notifications;
