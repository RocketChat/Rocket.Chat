import mem from 'mem';

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
import { IBaseData } from '../../../definition/IBaseData';
import { IPermission } from '../../../definition/IPermission';
import { ISetting, SettingValue } from '../../../definition/ISetting';
import { IInquiry } from '../../../definition/IInquiry';
import { UsersSessionsRaw } from '../../../app/models/server/raw/UsersSessions';
import { IUserSession } from '../../../definition/IUserSession';
import { subscriptionFields, roomFields } from './publishFields';
import { IUser } from '../../../definition/IUser';
import { LoginServiceConfigurationRaw } from '../../../app/models/server/raw/LoginServiceConfiguration';
import { ILoginServiceConfiguration } from '../../../definition/ILoginServiceConfiguration';
import { IInstanceStatus } from '../../../definition/IInstanceStatus';
import { InstanceStatusRaw } from '../../../app/models/server/raw/InstanceStatus';
import { IntegrationHistoryRaw } from '../../../app/models/server/raw/IntegrationHistory';
import { IIntegrationHistory } from '../../../definition/IIntegrationHistory';
import { LivechatDepartmentAgentsRaw } from '../../../app/models/server/raw/LivechatDepartmentAgents';
import { ILivechatDepartmentAgents } from '../../../definition/ILivechatDepartmentAgents';
import { IIntegration } from '../../../definition/IIntegration';
import { IntegrationsRaw } from '../../../app/models/server/raw/Integrations';
import { EventSignatures } from '../../sdk/lib/Events';
import { IEmailInbox } from '../../../definition/IEmailInbox';
import { EmailInboxRaw } from '../../../app/models/server/raw/EmailInbox';

interface IModelsParam {
	Subscriptions: SubscriptionsRaw;
	Permissions: PermissionsRaw;
	Users: UsersRaw;
	Settings: SettingsRaw;
	Messages: MessagesRaw;
	LivechatInquiry: LivechatInquiryRaw;
	LivechatDepartmentAgents: LivechatDepartmentAgentsRaw;
	UsersSessions: UsersSessionsRaw;
	Roles: RolesRaw;
	Rooms: RoomsRaw;
	LoginServiceConfiguration: LoginServiceConfigurationRaw;
	InstanceStatus: InstanceStatusRaw;
	IntegrationHistory: IntegrationHistoryRaw;
	Integrations: IntegrationsRaw;
	EmailInbox: EmailInboxRaw;
}

interface IChange<T> {
	action: 'insert' | 'update' | 'remove';
	clientAction: 'inserted' | 'updated' | 'removed';
	id: string;
	data?: T;
	diff?: Record<string, any>;
	unset?: Record<string, number>;
}

type Watcher = <T extends IBaseData>(model: IBaseRaw<T>, fn: (event: IChange<T>) => void) => void;

type BroadcastCallback = <T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>) => Promise<void>;

const hasKeys = (requiredKeys: string[]): (data?: Record<string, any>) => boolean =>
	(data?: Record<string, any>): boolean => {
		if (!data) {
			return false;
		}

		return Object.keys(data)
			.filter((key) => key !== '_id')
			.map((key) => key.split('.')[0])
			.some((key) => requiredKeys.includes(key));
	};

const hasRoomFields = hasKeys(Object.keys(roomFields));
const hasSubscriptionFields = hasKeys(Object.keys(subscriptionFields));

const startMonitor = typeof process.env.DISABLE_PRESENCE_MONITOR === 'undefined'
	|| !['true', 'yes'].includes(String(process.env.DISABLE_PRESENCE_MONITOR).toLowerCase());

export function initWatchers(models: IModelsParam, broadcast: BroadcastCallback, watch: Watcher): void {
	const {
		Messages,
		Users,
		Settings,
		Subscriptions,
		UsersSessions,
		Roles,
		Permissions,
		LivechatInquiry,
		LivechatDepartmentAgents,
		Rooms,
		LoginServiceConfiguration,
		InstanceStatus,
		IntegrationHistory,
		Integrations,
		EmailInbox,
	} = models;

	const getSettingCached = mem(async (setting: string): Promise<SettingValue> => Settings.getValueById(setting), { maxAge: 10000 });

	const getUserNameCached = mem(async (userId: string): Promise<string | undefined> => {
		const user = await Users.findOne<Pick<IUser, 'name'>>(userId, { projection: { name: 1 } });
		return user?.name;
	}, { maxAge: 10000 });

	watch<IMessage>(Messages, async ({ clientAction, id, data }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message: IMessage | undefined = data ?? await Messages.findOne({ _id: id });
				if (!message) {
					return;
				}

				if (message._hidden !== true && message.imported == null) {
					const UseRealName = await getSettingCached('UI_Use_Real_Name') === true;

					if (UseRealName) {
						if (message.u?._id) {
							const name = await getUserNameCached(message.u._id);
							if (name) {
								message.u.name = name;
							}
						}

						if (message.mentions?.length) {
							for await (const mention of message.mentions) {
								const name = await getUserNameCached(mention._id);
								if (name) {
									mention.name = name;
								}
							}
						}
					}

					broadcast('watch.messages', { clientAction, message });
				}
				break;
		}
	});

	watch<ISubscription>(Subscriptions, async ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated': {
				if (!hasSubscriptionFields(data || diff)) {
					return;
				}

				// Override data cuz we do not publish all fields
				const subscription = await Subscriptions.findOneById<Pick<ISubscription, keyof typeof subscriptionFields>>(id, { projection: subscriptionFields });
				if (!subscription) {
					return;
				}
				broadcast('watch.subscriptions', { clientAction, subscription });
				break;
			}

			case 'removed': {
				const trash = await Subscriptions.trashFindOneById<Pick<ISubscription, 'u' | 'rid'>>(id, { projection: { u: 1, rid: 1 } });
				const subscription = trash || { _id: id };
				broadcast('watch.subscriptions', { clientAction, subscription });
				break;
			}
		}
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

		broadcast('watch.roles', {
			clientAction: clientAction !== 'removed' ? 'changed' as const : clientAction,
			role,
		});
	});

	if (startMonitor) {
		watch<IUserSession>(UsersSessions, async ({ clientAction, id, data: eventData }) => {
			switch (clientAction) {
				case 'inserted':
				case 'updated':
					const data = eventData ?? await UsersSessions.findOneById(id);
					if (!data) {
						return;
					}

					broadcast('watch.userSessions', { clientAction, userSession: data });
					break;
				case 'removed':
					broadcast('watch.userSessions', { clientAction, userSession: { _id: id } });
					break;
			}
		});
	}

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

		broadcast('watch.inquiries', { clientAction, inquiry: data, diff });
	});

	watch<ILivechatDepartmentAgents>(LivechatDepartmentAgents, async ({ clientAction, id, diff }) => {
		if (clientAction === 'removed') {
			const data = await LivechatDepartmentAgents.trashFindOneById<Pick<ILivechatDepartmentAgents, 'agentId' | 'departmentId'>>(id, { projection: { agentId: 1, departmentId: 1 } });
			if (!data) {
				return;
			}
			broadcast('watch.livechatDepartmentAgents', { clientAction, id, data, diff });
			return;
		}

		const data = await LivechatDepartmentAgents.findOneById<Pick<ILivechatDepartmentAgents, 'agentId' |'departmentId'>>(id, { projection: { agentId: 1, departmentId: 1 } });
		if (!data) {
			return;
		}
		broadcast('watch.livechatDepartmentAgents', { clientAction, id, data, diff });
	});


	watch<IPermission>(Permissions, async ({ clientAction, id, data: eventData, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}
		let data;
		switch (clientAction) {
			case 'updated':
			case 'inserted':
				data = eventData ?? await Permissions.findOneById(id);
				break;

			case 'removed':
				data = { _id: id, roles: [] };
				break;
		}

		if (!data) {
			return;
		}

		broadcast('permission.changed', { clientAction, data });

		if (data.level === 'settings' && data.settingId) {
			// if the permission changes, the effect on the visible settings depends on the role affected.
			// The selected-settings-based consumers have to react accordingly and either add or remove the
			// setting from the user's collection
			const setting = await Settings.findOneNotHiddenById(data.settingId);
			if (!setting) {
				return;
			}
			broadcast('watch.settings', { clientAction: 'updated', setting });
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

		broadcast('watch.settings', { clientAction, setting });
	});

	watch<IRoom>(Rooms, async ({ clientAction, id, data, diff }) => {
		if (clientAction === 'removed') {
			broadcast('watch.rooms', { clientAction, room: { _id: id } });
			return;
		}

		if (!hasRoomFields(data || diff)) {
			return;
		}

		const room = data ?? await Rooms.findOneById(id, { projection: roomFields });
		if (!room) {
			return;
		}

		broadcast('watch.rooms', { clientAction, room });
	});

	// TODO: Prevent flood from database on username change, what causes changes on all past messages from that user
	// and most of those messages are not loaded by the clients.
	watch<IUser>(Users, ({ clientAction, id, data, diff, unset }) => {
		broadcast('watch.users', { clientAction, data, diff, unset, id });
	});

	watch<ILoginServiceConfiguration>(LoginServiceConfiguration, async ({ clientAction, id }) => {
		const data = await LoginServiceConfiguration.findOne<Omit<ILoginServiceConfiguration, 'secret'>>(id, { projection: { secret: 0 } });
		if (!data) {
			return;
		}

		broadcast('watch.loginServiceConfiguration', { clientAction, data, id });
	});

	watch<IInstanceStatus>(InstanceStatus, ({ clientAction, id, data, diff }) => {
		broadcast('watch.instanceStatus', { clientAction, data, diff, id });
	});

	watch<IIntegrationHistory>(IntegrationHistory, async ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'updated': {
				const history = await IntegrationHistory.findOneById<Pick<IIntegrationHistory, 'integration'>>(id, { projection: { 'integration._id': 1 } });
				if (!history || !history.integration) {
					return;
				}
				broadcast('watch.integrationHistory', { clientAction, data: history, diff, id });
				break;
			}
			case 'inserted': {
				if (!data) {
					return;
				}
				broadcast('watch.integrationHistory', { clientAction, data, diff, id });
				break;
			}
		}
	});

	watch<IIntegration>(Integrations, async ({ clientAction, id, data }) => {
		if (clientAction === 'removed') {
			broadcast('watch.integrations', { clientAction, id, data: { _id: id } });
			return;
		}

		data = data ?? await Integrations.findOneById(id);
		if (!data) {
			return;
		}

		broadcast('watch.integrations', { clientAction, data, id });
	});

	watch<IEmailInbox>(EmailInbox, async ({ clientAction, id, data: eventData }) => {
		if (clientAction === 'removed') {
			broadcast('watch.emailInbox', { clientAction, id, data: { _id: id } });
			return;
		}

		const data = eventData ?? await EmailInbox.findOneById(id);
		if (!data) {
			return;
		}

		broadcast('watch.emailInbox', { clientAction, data, id });
	});
}
