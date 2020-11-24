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
import { ISetting } from '../../../definition/ISetting';
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
	} = models;

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

					broadcast('watch.messages', { clientAction, message });
				}
				break;
		}
	});

	watch<ISubscription>(Subscriptions, async ({ clientAction, id }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated': {
				// Override data cuz we do not publish all fields
				const subscription = await Subscriptions.findOneById(id, { projection: subscriptionFields });
				if (!subscription) {
					return;
				}
				broadcast('watch.subscriptions', { clientAction, subscription });
				break;
			}

			case 'removed': {
				const trash = await Subscriptions.trashFindOneById(id, { projection: { u: 1, rid: 1 } });
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

				broadcast('watch.userSessions', { clientAction, userSession: data });
				break;
			case 'removed':
				broadcast('watch.userSessions', { clientAction, userSession: { _id: id } });
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

		broadcast('watch.inquiries', { clientAction, inquiry: data, diff });
	});

	watch<ILivechatDepartmentAgents>(LivechatDepartmentAgents, async ({ clientAction, id, data, diff }) => {
		if (clientAction === 'removed') {
			data = await LivechatDepartmentAgents.trashFindOneById(id, { projection: { agentId: 1, departmentId: 1 } });
			if (!data) {
				return;
			}
			broadcast('watch.livechatDepartmentAgents', { clientAction, id, data, diff });
			return;
		}

		data = await LivechatDepartmentAgents.findOneById(id, { projection: { agentId: 1, departmentId: 1 } });
		if (!data) {
			return;
		}
		broadcast('watch.livechatDepartmentAgents', { clientAction, id, data, diff });
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

	watch<IRoom>(Rooms, async ({ clientAction, id, data }) => {
		if (clientAction === 'removed') {
			broadcast('watch.rooms', { clientAction, room: { _id: id } });
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
		const data = await InstanceStatus.findOneById(id, { projection: { secret: 0 } });
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
				const history = await IntegrationHistory.findOneById(id, { projection: { 'integration._id': 1 } });
				if (!history || !history.integration) {
					return;
				}
				data = history;
				broadcast('watch.integrationHistory', { clientAction, data, diff, id });
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
}
