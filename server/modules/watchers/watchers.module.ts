// import { Authorization } from '../../sdk';
// import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { PermissionsRaw } from '../../../app/models/server/raw/Permissions';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RolesRaw } from '../../../app/models/server/raw/Roles';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { IMessage } from '../../../definition/IMessage';
import { ISubscription } from '../../../definition/ISubscription';
import { IRole } from '../../../definition/IRole';
import { IRoom } from '../../../definition/IRoom';
import { IBaseRaw } from '../../../app/models/server/raw/BaseRaw';
import { LivechatInquiryRaw } from '../../../app/models/server/raw/LivechatInquiry';
import { api } from '../../sdk/api';
import { IBaseData } from '../../../definition/IBaseData';
import { IPermission } from '../../../definition/IPermission';
import { ISetting } from '../../../definition/ISetting';
import { IInquiry } from '../../../definition/IInquiry';
import { UsersSessionsRaw } from '../../../app/models/server/raw/UsersSessions';
import { IUserSession } from '../../../definition/IUserSession';
import { subscriptionFields, roomFields } from './publishFields';
import { IUser } from '../../../definition/IUser';

interface IModelsParam {
	// Rooms: RoomsRaw;
	Subscriptions: SubscriptionsRaw;
	Permissions: PermissionsRaw;
	Users: UsersRaw;
	Settings: SettingsRaw;
	Messages: MessagesRaw;
	LivechatInquiry: LivechatInquiryRaw;
	UsersSessions: UsersSessionsRaw;
	Roles: RolesRaw;
	Rooms: RoomsRaw;
}

interface IChange<T> {
	action: 'insert' | 'update' | 'remove';
	clientAction: 'inserted' | 'updated' | 'removed';
	id: string;
	data?: T;
	diff?: Record<string, any>;
}

type Watcher = <T extends IBaseData>(model: IBaseRaw<T>, fn: (event: IChange<T>) => void) => void;

export function initWatchers({
	Messages,
	Users,
	Settings,
	Subscriptions,
	UsersSessions,
	Roles,
	Permissions,
	LivechatInquiry,
	Rooms,
}: IModelsParam, watch: Watcher): void {
	watch<IMessage>(Messages, async ({ clientAction, id, data }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message: IMessage | undefined = data ?? await Messages.findOne({ _id: id });
				if (!message) {
					return;
				}

				if (message._hidden !== true && message.imported == null) {
					const UseRealName = await Settings.getValueById('UI_Use_Real_Name') === true;

					if (UseRealName) {
						if (message.u?._id) {
							const user = await Users.findOneById(message.u._id);
							message.u.name = user?.name;
						}

						if (message.mentions?.length) {
							for await (const mention of message.mentions) {
								const user = await Users.findOneById(mention._id);
								mention.name = user?.name;
							}
						}
					}

					api.broadcast('watch.messages', { clientAction, message });
				}
				break;
		}
	});

	watch<ISubscription>(Subscriptions, async ({ clientAction, id, data }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				// Override data cuz we do not publish all fields
				data = await Subscriptions.findOneById(id, { projection: subscriptionFields });
				break;

			case 'removed':
				data = await Subscriptions.trashFindOneById(id, { projection: { u: 1, rid: 1 } });
				break;
		}

		if (!data) {
			return;
		}

		api.broadcast('watch.subscriptions', { clientAction, subscription: data });
	});

	watch<IRole>(Roles, async ({ clientAction, id, data, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}

		const role = clientAction === 'removed'
			? { _id: id, name: id }
			: data || await Roles.findOneById(id);

		if (!role) {
			return;
		}

		api.broadcast('watch.roles', {
			clientAction: clientAction !== 'removed' ? 'changed' : clientAction,
			role,
		});
	});

	watch<IUserSession>(UsersSessions, async ({ clientAction, id, data }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				data = data ?? await UsersSessions.findOneById(id);
				if (!data) {
					return;
				}

				api.broadcast('watch.userSessions', { clientAction, userSession: data });
				break;
			case 'removed':
				api.broadcast('watch.userSessions', { clientAction, userSession: { _id: id } });
				break;
		}
	});

	watch<IInquiry>(LivechatInquiry, async ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				data = data ?? await LivechatInquiry.findOneById(id);
				break;

			case 'removed':
				data = await LivechatInquiry.trashFindOneById(id);
				break;
		}

		if (!data) {
			return;
		}

		api.broadcast('watch.inquiries', { clientAction, inquiry: data, diff });
	});

	watch<IPermission>(Permissions, async ({ clientAction, id, data, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}
		switch (clientAction) {
			case 'updated':
			case 'inserted':
				data = data ?? await Permissions.findOneById(id);
				break;

			case 'removed':
				data = { _id: id, roles: [] };
				break;
		}

		if (!data) {
			return;
		}

		api.broadcast('permission.changed', { clientAction, data });

		if (data.level === 'settings' && data.settingId) {
			// if the permission changes, the effect on the visible settings depends on the role affected.
			// The selected-settings-based consumers have to react accordingly and either add or remove the
			// setting from the user's collection
			const setting = await Settings.findOneNotHiddenById(data.settingId);
			if (!setting) {
				return;
			}
			api.broadcast('watch.settings', { clientAction: 'updated', setting });
		}
	});

	watch<ISetting>(Settings, async ({ clientAction, id, data, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) { // avoid useless changes
			return;
		}

		let setting;
		switch (clientAction) {
			case 'updated':
			case 'inserted': {
				setting = data ?? await Settings.findOneById(id);
				break;
			}

			case 'removed': {
				setting = data ?? await Settings.trashFindOneById(id);
				break;
			}
		}

		if (!setting) {
			return;
		}

		api.broadcast('watch.settings', { clientAction, setting });
	});

	watch<IRoom>(Rooms, async ({ clientAction, id, data }) => {
		if (clientAction === 'removed') {
			api.broadcast('watch.rooms', { clientAction, room: { _id: id } });
			return;
		}

		const room = data ?? await Rooms.findOneById(id, { projection: roomFields });
		if (!room) {
			return;
		}

		api.broadcast('watch.rooms', { clientAction, room });
	});

	watch<IUser>(Users, ({ clientAction, id, data, diff }) => {
		api.broadcast('watch.users', { clientAction, data, diff, id });
	});
}
