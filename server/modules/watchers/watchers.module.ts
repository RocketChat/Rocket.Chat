// import { Authorization } from '../../sdk';
// import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { SettingsRaw } from '../../../app/models/server/raw/Settings';
import { PermissionsRaw } from '../../../app/models/server/raw/Permissions';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RolesRaw } from '../../../app/models/server/raw/Roles';
import { IMessage } from '../../../definition/IMessage';
import { ISubscription } from '../../../definition/ISubscription';
import { IRole } from '../../../definition/IRole';
import { IBaseRaw } from '../../../app/models/server/raw/BaseRaw';
import { api } from '../../sdk/api';
import { IBaseData } from '../../../definition/IBaseData';
import { IPermission } from '../../../definition/IPermission';
import { ISetting } from '../../../definition/ISetting';

interface IModelsParam {
	// Rooms: RoomsRaw;
	Subscriptions: SubscriptionsRaw;
	Permissions: PermissionsRaw;
	Users: UsersRaw;
	Settings: SettingsRaw;
	Messages: MessagesRaw;
	Roles: RolesRaw;
}

interface IChange<T> {
	action: 'insert' | 'update' | 'remove';
	clientAction: 'inserted' | 'updated' | 'removed';
	id: string;
	data?: T;
	diff?: Record<string, any>;
}

type Watcher = <T extends IBaseData>(model: IBaseRaw<T>, fn: (event: IChange<T>) => void) => void;

// TODO: find a better place
export const subscriptionFields = {
	t: 1,
	ts: 1,
	ls: 1,
	lr: 1,
	name: 1,
	fname: 1,
	rid: 1,
	code: 1,
	f: 1,
	u: 1,
	open: 1,
	alert: 1,
	roles: 1,
	unread: 1,
	prid: 1,
	userMentions: 1,
	groupMentions: 1,
	archived: 1,
	audioNotifications: 1,
	audioNotificationValue: 1,
	desktopNotifications: 1,
	mobilePushNotifications: 1,
	emailNotifications: 1,
	unreadAlert: 1,
	_updatedAt: 1,
	blocked: 1,
	blocker: 1,
	autoTranslate: 1,
	autoTranslateLanguage: 1,
	disableNotifications: 1,
	hideUnreadStatus: 1,
	muteGroupMentions: 1,
	ignored: 1,
	E2EKey: 1,
	tunread: 1,
	tunreadGroup: 1,
	tunreadUser: 1,
};

export function initWatchers({
	Messages,
	Users,
	Settings,
	Subscriptions,
	Roles,
	Permissions,
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

	watch<IRole>(Roles, async ({ clientAction, id, data }) => {
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
}
