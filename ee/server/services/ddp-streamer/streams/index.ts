import { Stream } from '../Streamer';
import { NotificationsModule } from '../../../../../server/modules/notifications/notifications.module';
import { ISubscription } from '../../../../../definition/ISubscription';
import { IRoom } from '../../../../../definition/IRoom';
import { IUser } from '../../../../../definition/IUser';
import { ISetting } from '../../../../../definition/ISetting';
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
