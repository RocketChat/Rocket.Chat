import mem from 'mem';
import type {
	ISubscription,
	IUser,
	ILoginServiceConfiguration,
	IIntegrationHistory,
	ILivechatDepartmentAgents,
	IMessage,
	IPermission,
	ISetting,
	IRoom,
	IInstanceStatus,
	IIntegration,
	IEmailInbox,
	IPbxEvent,
	SettingValue,
	ILivechatInquiryRecord,
	IRole,
	IUserSession,
} from '@rocket.chat/core-typings';
import {
	Subscriptions,
	Messages,
	Users,
	Settings,
	Roles,
	UsersSessions,
	LivechatInquiry,
	LivechatDepartmentAgents,
	Rooms,
	LoginServiceConfiguration,
	InstanceStatus,
	IntegrationHistory,
	Integrations,
	EmailInbox,
	PbxEvents,
	Permissions,
} from '@rocket.chat/models';

import { subscriptionFields, roomFields } from './publishFields';
import type { EventSignatures } from '../../sdk/lib/Events';
import { isPresenceMonitorEnabled } from '../../lib/isPresenceMonitorEnabled';
import type { DatabaseWatcher } from '../../database/DatabaseWatcher';

type BroadcastCallback = <T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>) => Promise<void>;

const hasKeys =
	(requiredKeys: string[]): ((data?: Record<string, any>) => boolean) =>
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

let watcherStarted = false;
export function isWatcherRunning(): boolean {
	return watcherStarted;
}

export function initWatchers(watcher: DatabaseWatcher, broadcast: BroadcastCallback): void {
	const getSettingCached = mem(async (setting: string): Promise<SettingValue> => Settings.getValueById(setting), { maxAge: 10000 });

	const getUserNameCached = mem(
		async (userId: string): Promise<string | undefined> => {
			const user = await Users.findOne<Pick<IUser, 'name'>>(userId, { projection: { name: 1 } });
			return user?.name;
		},
		{ maxAge: 10000 },
	);

	watcher.on<IMessage>(Messages.getCollectionName(), async ({ clientAction, id, data }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data ?? (await Messages.findOneById(id));
				if (!message) {
					return;
				}

				if (message._hidden !== true && message.imported == null) {
					const UseRealName = (await getSettingCached('UI_Use_Real_Name')) === true;

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

	watcher.on<ISubscription>(Subscriptions.getCollectionName(), async ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated': {
				if (!hasSubscriptionFields(data || diff)) {
					return;
				}

				// Override data cuz we do not publish all fields
				const subscription = await Subscriptions.findOneById<Pick<ISubscription, keyof typeof subscriptionFields>>(id, {
					projection: subscriptionFields,
				});
				if (!subscription) {
					return;
				}
				broadcast('watch.subscriptions', { clientAction, subscription });
				break;
			}

			case 'removed': {
				const trash = await Subscriptions.trashFindOneById<Pick<ISubscription, 'u' | 'rid'>>(id, {
					projection: { u: 1, rid: 1 },
				});
				const subscription = trash || { _id: id };
				broadcast('watch.subscriptions', { clientAction, subscription });
				break;
			}
		}
	});

	watcher.on<IRole>(Roles.getCollectionName(), async ({ clientAction, id, data, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}

		const role = clientAction === 'removed' ? { _id: id, name: id } : data || (await Roles.findOneById(id));

		if (!role) {
			return;
		}

		broadcast('watch.roles', {
			clientAction: clientAction !== 'removed' ? ('changed' as const) : clientAction,
			role,
		});
	});

	if (isPresenceMonitorEnabled()) {
		watcher.on<IUserSession>(UsersSessions.getCollectionName(), async ({ clientAction, id, data: eventData }) => {
			switch (clientAction) {
				case 'inserted':
				case 'updated':
					const data = eventData ?? (await UsersSessions.findOneById(id));
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

	watcher.on<ILivechatInquiryRecord>(LivechatInquiry.getCollectionName(), async ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				data = data ?? (await LivechatInquiry.findOneById(id)) ?? undefined;
				break;

			case 'removed':
				data = (await LivechatInquiry.trashFindOneById(id)) ?? undefined;
				break;
		}

		if (!data) {
			return;
		}

		broadcast('watch.inquiries', { clientAction, inquiry: data, diff });
	});

	watcher.on<ILivechatDepartmentAgents>(LivechatDepartmentAgents.getCollectionName(), async ({ clientAction, id, diff }) => {
		if (clientAction === 'removed') {
			const data = await LivechatDepartmentAgents.trashFindOneById<Pick<ILivechatDepartmentAgents, 'agentId' | 'departmentId'>>(id, {
				projection: { agentId: 1, departmentId: 1 },
			});
			if (!data) {
				return;
			}
			broadcast('watch.livechatDepartmentAgents', { clientAction, id, data, diff });
			return;
		}

		const data = await LivechatDepartmentAgents.findOneById<Pick<ILivechatDepartmentAgents, 'agentId' | 'departmentId'>>(id, {
			projection: { agentId: 1, departmentId: 1 },
		});
		if (!data) {
			return;
		}
		broadcast('watch.livechatDepartmentAgents', { clientAction, id, data, diff });
	});

	watcher.on<IPermission>(Permissions.getCollectionName(), async ({ clientAction, id, data: eventData, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}
		let data;
		switch (clientAction) {
			case 'updated':
			case 'inserted':
				data = eventData ?? (await Permissions.findOneById(id));
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

	watcher.on<ISetting>(Settings.getCollectionName(), async ({ clientAction, id, data, diff }) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}

		let setting;
		switch (clientAction) {
			case 'updated':
			case 'inserted': {
				setting = data ?? (await Settings.findOneById(id));
				break;
			}

			case 'removed': {
				setting = data ?? (await Settings.trashFindOneById(id));
				break;
			}
		}

		if (!setting) {
			return;
		}

		broadcast('watch.settings', { clientAction, setting });
	});

	watcher.on<IRoom>(Rooms.getCollectionName(), async ({ clientAction, id, data, diff }) => {
		if (clientAction === 'removed') {
			broadcast('watch.rooms', { clientAction, room: { _id: id } });
			return;
		}

		if (!hasRoomFields(data || diff)) {
			return;
		}

		const room = data ?? (await Rooms.findOneById(id, { projection: roomFields }));
		if (!room) {
			return;
		}

		broadcast('watch.rooms', { clientAction, room });
	});

	// TODO: Prevent flood from database on username change, what causes changes on all past messages from that user
	// and most of those messages are not loaded by the clients.
	watcher.on<IUser>(Users.getCollectionName(), ({ clientAction, id, data, diff, unset }) => {
		// LivechatCount is updated each time an agent is routed to a chat. This prop is not used on the UI so we don't need
		// to broadcast events originated by it when it's the only update on the user
		if (diff && Object.keys(diff).length === 1 && 'livechatCount' in diff) {
			return;
		}

		broadcast('watch.users', { clientAction, data, diff, unset, id });
	});

	watcher.on<ILoginServiceConfiguration>(LoginServiceConfiguration.getCollectionName(), async ({ clientAction, id }) => {
		const data = await LoginServiceConfiguration.findOne<Omit<ILoginServiceConfiguration, 'secret'>>(id, { projection: { secret: 0 } });
		if (!data) {
			return;
		}

		broadcast('watch.loginServiceConfiguration', { clientAction, data, id });
	});

	watcher.on<IInstanceStatus>(InstanceStatus.getCollectionName(), ({ clientAction, id, data, diff }) => {
		broadcast('watch.instanceStatus', { clientAction, data, diff, id });
	});

	watcher.on<IIntegrationHistory>(IntegrationHistory.getCollectionName(), async ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'updated': {
				const history = await IntegrationHistory.findOneById<Pick<IIntegrationHistory, 'integration'>>(id, {
					projection: { 'integration._id': 1 },
				});
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

	watcher.on<IIntegration>(Integrations.getCollectionName(), async ({ clientAction, id, data: eventData }) => {
		if (clientAction === 'removed') {
			broadcast('watch.integrations', { clientAction, id, data: { _id: id } });
			return;
		}

		const data = eventData ?? (await Integrations.findOneById(id));
		if (!data) {
			return;
		}

		broadcast('watch.integrations', { clientAction, data, id });
	});

	watcher.on<IEmailInbox>(EmailInbox.getCollectionName(), async ({ clientAction, id, data: eventData }) => {
		if (clientAction === 'removed') {
			broadcast('watch.emailInbox', { clientAction, id, data: { _id: id } });
			return;
		}

		const data = eventData ?? (await EmailInbox.findOneById(id));
		if (!data) {
			return;
		}

		broadcast('watch.emailInbox', { clientAction, data, id });
	});

	watcher.on<IPbxEvent>(PbxEvents.getCollectionName(), async ({ clientAction, id, data: eventData }) => {
		// For now, we just care about insertions here
		if (clientAction === 'inserted') {
			const data = eventData ?? (await PbxEvents.findOneById(id));
			if (!data || !['ContactStatus', 'Hangup'].includes(data.event)) {
				// For now, we'll only care about agent connect/disconnect events
				// Other events are not handled by watchers but by service
				return;
			}

			broadcast('watch.pbxevents', { clientAction, data, id });
		}
	});

	watcherStarted = true;
}
