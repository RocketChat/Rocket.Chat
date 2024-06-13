import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type {
	IRocketChatRecord,
	IRoom,
	ILoginServiceConfiguration,
	ISetting,
	IRole,
	IPermission,
	IIntegration,
	IPbxEvent,
	LoginServiceConfiguration as LoginServiceConfigurationData,
	ILivechatPriority,
	ILivechatDepartmentAgents,
	IEmailInbox,
	IIntegrationHistory,
	AtLeast,
} from '@rocket.chat/core-typings';
import {
	Rooms,
	Permissions,
	Settings,
	PbxEvents,
	Roles,
	Integrations,
	LoginServiceConfiguration,
	IntegrationHistory,
	LivechatDepartmentAgents,
} from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyOnLivechatPriorityChanged(
	data: Pick<ILivechatPriority, 'name' | '_id'>,
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const { _id, ...rest } = data;

	void api.broadcast('watch.priorities', { clientAction, id: _id, diff: { ...rest } });
}

export async function notifyOnRoomChanged<T extends IRocketChatRecord>(
	data: T | T[],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Array.isArray(data) ? data : [data];

	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnRoomChangedById<T extends IRocketChatRecord>(
	ids: T['_id'] | T['_id'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const eligibleIds = Array.isArray(ids) ? ids : [ids];

	const items = Rooms.findByIds(eligibleIds);

	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnRoomChangedByUsernamesOrUids<T extends IRoom>(
	uids: T['u']['_id'][],
	usernames: T['u']['username'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Rooms.findByUsernamesOrUids(uids, usernames);

	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnRoomChangedByUserDM<T extends IRoom>(
	userId: T['u']['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Rooms.findDMsByUids([userId]);

	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnSettingChanged(setting: ISetting, clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.settings', { clientAction, setting });
}

export async function notifyOnPermissionChanged(permission: IPermission, clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('permission.changed', { clientAction, data: permission });

	if (permission.level === 'settings' && permission.settingId) {
		const setting = await Settings.findOneNotHiddenById(permission.settingId);
		if (!setting) {
			return;
		}
		void notifyOnSettingChanged(setting, 'updated');
	}
}

export async function notifyOnPermissionChangedById(pid: IPermission['_id'], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const permission = await Permissions.findOneById(pid);
	if (!permission) {
		return;
	}

	return notifyOnPermissionChanged(permission, clientAction);
}

export async function notifyOnPbxEventChangedById<T extends IPbxEvent>(
	id: T['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const item = await PbxEvents.findOneById(id);
	if (!item) {
		return;
	}

	void api.broadcast('watch.pbxevents', { clientAction, id, data: item });
}

export async function notifyOnRoleChanged<T extends IRole>(role: T, clientAction: 'removed' | 'changed' = 'changed'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.roles', { clientAction, role });
}

export async function notifyOnRoleChangedById<T extends IRole>(
	id: T['_id'],
	clientAction: 'removed' | 'changed' = 'changed',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const role = await Roles.findOneById(id);
	if (!role) {
		return;
	}

	void notifyOnRoleChanged(role, clientAction);
}

export async function notifyOnLoginServiceConfigurationChanged<T extends ILoginServiceConfiguration>(
	service: Partial<T> & Pick<T, '_id'>,
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.loginServiceConfiguration', {
		clientAction,
		id: service._id,
		data: service,
	});
}

export async function notifyOnLoginServiceConfigurationChangedByService<T extends ILoginServiceConfiguration>(
	service: T['service'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const item = await LoginServiceConfiguration.findOneByService<Omit<LoginServiceConfigurationData, 'secret'>>(service, {
		projection: { secret: 0 },
	});
	if (!item) {
		return;
	}

	void notifyOnLoginServiceConfigurationChanged(item, clientAction);
}

export async function notifyOnIntegrationChanged<T extends IIntegration>(data: T, clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.integrations', { clientAction, id: data._id, data });
}

export async function notifyOnIntegrationChangedById<T extends IIntegration>(
	id: T['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const item = await Integrations.findOneById(id);
	if (!item) {
		return;
	}

	void api.broadcast('watch.integrations', { clientAction, id: item._id, data: item });
}

export async function notifyOnIntegrationChangedByUserId<T extends IIntegration>(
	id: T['userId'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Integrations.findByUserId(id);

	for await (const item of items) {
		void api.broadcast('watch.integrations', { clientAction, id: item._id, data: item });
	}
}

export async function notifyOnIntegrationChangedByChannels<T extends IIntegration>(
	channels: T['channel'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Integrations.findByChannels(channels);

	for await (const item of items) {
		void api.broadcast('watch.integrations', { clientAction, id: item._id, data: item });
	}
}

export async function notifyOnEmailInboxChanged<T extends IEmailInbox>(
	data: Pick<T, '_id'> | T, // TODO: improve typing
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.emailInbox', { clientAction, id: data._id, data });
}

export async function notifyOnIntegrationHistoryChanged<T extends IIntegrationHistory>(
	data: AtLeast<T, '_id'>,
	clientAction: ClientAction = 'updated',
	diff: Partial<T> = {},
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.integrationHistory', { clientAction, id: data._id, data, diff });
}

export async function notifyOnIntegrationHistoryChangedById<T extends IIntegrationHistory>(
	id: T['_id'],
	clientAction: ClientAction = 'updated',
	diff: Partial<T> = {},
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const item = await IntegrationHistory.findOneById(id);

	if (!item) {
		return;
	}

	void api.broadcast('watch.integrationHistory', { clientAction, id: item._id, data: item, diff });
}

export async function notifyOnLivechatDepartmentAgentChanged<T extends ILivechatDepartmentAgents>(
	data: Partial<T> & Pick<T, '_id' | 'agentId' | 'departmentId'>,
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	void api.broadcast('watch.livechatDepartmentAgents', { clientAction, id: data._id, data });
}

export async function notifyOnLivechatDepartmentAgentChangedByDepartmentId<T extends ILivechatDepartmentAgents>(
	departmentId: T['departmentId'],
	clientAction: 'inserted' | 'updated' = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = LivechatDepartmentAgents.findByDepartmentId(departmentId, { projection: { _id: 1, agentId: 1, departmentId: 1 } });

	for await (const item of items) {
		void api.broadcast('watch.livechatDepartmentAgents', { clientAction, id: item._id, data: item });
	}
}

export async function notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId<T extends ILivechatDepartmentAgents>(
	agentsIds: T['agentId'][],
	departmentId: T['departmentId'],
	clientAction: 'inserted' | 'updated' = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = LivechatDepartmentAgents.findByAgentsAndDepartmentId(agentsIds, departmentId, {
		projection: { _id: 1, agentId: 1, departmentId: 1 },
	});

	for await (const item of items) {
		void api.broadcast('watch.livechatDepartmentAgents', { clientAction, id: item._id, data: item });
	}
}
