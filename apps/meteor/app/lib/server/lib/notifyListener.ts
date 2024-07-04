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
	ILivechatInquiryRecord,
	ILivechatPriority,
	ILivechatDepartmentAgents,
	IEmailInbox,
	IIntegrationHistory,
	AtLeast,
	ISettingColor,
	IUser,
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
	LivechatInquiry,
	LivechatDepartmentAgents,
	Users,
} from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

function withDbWatcherCheck<T extends (...args: any[]) => Promise<void>>(fn: T): T {
	return dbWatchersDisabled ? fn : ((() => Promise.resolve()) as T);
}

const _notifyOnLivechatPriorityChanged = async (
	data: Pick<ILivechatPriority, 'name' | '_id'>,
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const { _id, ...rest } = data;
	void api.broadcast('watch.priorities', { clientAction, id: _id, diff: { ...rest } });
};

const _notifyOnRoomChanged = async <T extends IRocketChatRecord>(data: T | T[], clientAction: ClientAction = 'updated'): Promise<void> => {
	const items = Array.isArray(data) ? data : [data];
	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
};

const _notifyOnRoomChangedById = async <T extends IRocketChatRecord>(
	ids: T['_id'] | T['_id'][],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const eligibleIds = Array.isArray(ids) ? ids : [ids];
	const items = Rooms.findByIds(eligibleIds);
	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
};

const _notifyOnRoomChangedByUsernamesOrUids = async <T extends IRoom>(
	uids: T['u']['_id'][],
	usernames: T['u']['username'][],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const items = Rooms.findByUsernamesOrUids(uids, usernames);
	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
};

const _notifyOnRoomChangedByUserDM = async <T extends IRoom>(
	userId: T['u']['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const items = Rooms.findDMsByUids([userId]);
	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
};

const _notifyOnPermissionChanged = async (permission: IPermission, clientAction: ClientAction = 'updated'): Promise<void> => {
	void api.broadcast('permission.changed', { clientAction, data: permission });

	if (permission.level === 'settings' && permission.settingId) {
		const setting = await Settings.findOneNotHiddenById(permission.settingId);
		if (!setting) {
			return;
		}
		void _notifyOnSettingChanged(setting, 'updated');
	}
};

const _notifyOnPermissionChangedById = async (pid: IPermission['_id'], clientAction: ClientAction = 'updated'): Promise<void> => {
	const permission = await Permissions.findOneById(pid);
	if (!permission) {
		return;
	}

	return _notifyOnPermissionChanged(permission, clientAction);
};

const _notifyOnPbxEventChangedById = async <T extends IPbxEvent>(id: T['_id'], clientAction: ClientAction = 'updated'): Promise<void> => {
	const item = await PbxEvents.findOneById(id);
	if (!item) {
		return;
	}

	void api.broadcast('watch.pbxevents', { clientAction, id, data: item });
};

const _notifyOnRoleChanged = async <T extends IRole>(role: T, clientAction: 'removed' | 'changed' = 'changed'): Promise<void> => {
	void api.broadcast('watch.roles', { clientAction, role });
};

const _notifyOnRoleChangedById = async <T extends IRole>(id: T['_id'], clientAction: 'removed' | 'changed' = 'changed'): Promise<void> => {
	const role = await Roles.findOneById(id);
	if (!role) {
		return;
	}

	void _notifyOnRoleChanged(role, clientAction);
};

const _notifyOnLoginServiceConfigurationChanged = async <T extends ILoginServiceConfiguration>(
	service: Partial<T> & Pick<T, '_id'>,
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	void api.broadcast('watch.loginServiceConfiguration', {
		clientAction,
		id: service._id,
		data: service,
	});
};

const _notifyOnLoginServiceConfigurationChangedByService = async <T extends ILoginServiceConfiguration>(
	service: T['service'],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const item = await LoginServiceConfiguration.findOneByService<Omit<LoginServiceConfigurationData, 'secret'>>(service, {
		projection: { secret: 0 },
	});
	if (!item) {
		return;
	}

	void _notifyOnLoginServiceConfigurationChanged(item, clientAction);
};

const _notifyOnIntegrationChanged = async <T extends IIntegration>(data: T, clientAction: ClientAction = 'updated'): Promise<void> => {
	void api.broadcast('watch.integrations', { clientAction, id: data._id, data });
};

const _notifyOnIntegrationChangedById = async <T extends IIntegration>(
	id: T['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const item = await Integrations.findOneById(id);
	if (!item) {
		return;
	}

	void api.broadcast('watch.integrations', { clientAction, id: item._id, data: item });
};

const _notifyOnIntegrationChangedByUserId = async <T extends IIntegration>(
	id: T['userId'],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const items = Integrations.findByUserId(id);

	for await (const item of items) {
		void api.broadcast('watch.integrations', { clientAction, id: item._id, data: item });
	}
};

const _notifyOnIntegrationChangedByChannels = async <T extends IIntegration>(
	channels: T['channel'],
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	const items = Integrations.findByChannels(channels);

	for await (const item of items) {
		void api.broadcast('watch.integrations', { clientAction, id: item._id, data: item });
	}
};

const _notifyOnEmailInboxChanged = async <T extends IEmailInbox>(
	data: Pick<T, '_id'> | T, // TODO: improve typing
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	void api.broadcast('watch.emailInbox', { clientAction, id: data._id, data });
};

const _notifyOnLivechatInquiryChanged = async (
	data: ILivechatInquiryRecord | ILivechatInquiryRecord[],
	clientAction: ClientAction = 'updated',
	diff?: Partial<Record<keyof ILivechatInquiryRecord, unknown> & { queuedAt: unknown; takenAt: unknown }>,
): Promise<void> => {
	const items = Array.isArray(data) ? data : [data];

	for (const item of items) {
		void api.broadcast('watch.inquiries', { clientAction, inquiry: item, diff });
	}
};

const _notifyOnLivechatInquiryChangedById = async (
	id: ILivechatInquiryRecord['_id'],
	clientAction: ClientAction = 'updated',
	diff?: Partial<Record<keyof ILivechatInquiryRecord, unknown> & { queuedAt: unknown; takenAt: unknown }>,
): Promise<void> => {
	const inquiry = clientAction === 'removed' ? await LivechatInquiry.trashFindOneById(id) : await LivechatInquiry.findOneById(id);

	if (!inquiry) {
		return;
	}

	void api.broadcast('watch.inquiries', { clientAction, inquiry, diff });
};

const _notifyOnLivechatInquiryChangedByRoom = async (
	rid: ILivechatInquiryRecord['rid'],
	clientAction: ClientAction = 'updated',
	diff?: Partial<Record<keyof ILivechatInquiryRecord, unknown> & { queuedAt: unknown; takenAt: unknown }>,
): Promise<void> => {
	const inquiry = await LivechatInquiry.findOneByRoomId(rid, {});

	if (!inquiry) {
		return;
	}

	void api.broadcast('watch.inquiries', { clientAction, inquiry, diff });
};

const _notifyOnLivechatInquiryChangedByToken = async (
	token: ILivechatInquiryRecord['v']['token'],
	clientAction: ClientAction = 'updated',
	diff?: Partial<Record<keyof ILivechatInquiryRecord, unknown> & { queuedAt: unknown; takenAt: unknown }>,
): Promise<void> => {
	const inquiry = await LivechatInquiry.findOneByToken(token);

	if (!inquiry) {
		return;
	}

	void api.broadcast('watch.inquiries', { clientAction, inquiry, diff });
};

const _notifyOnIntegrationHistoryChanged = async <T extends IIntegrationHistory>(
	data: AtLeast<T, '_id'>,
	clientAction: ClientAction = 'updated',
	diff: Partial<T> = {},
): Promise<void> => {
	void api.broadcast('watch.integrationHistory', { clientAction, id: data._id, data, diff });
};

const _notifyOnIntegrationHistoryChangedById = async <T extends IIntegrationHistory>(
	id: T['_id'],
	clientAction: ClientAction = 'updated',
	diff: Partial<T> = {},
): Promise<void> => {
	const item = await IntegrationHistory.findOneById(id);

	if (!item) {
		return;
	}

	void api.broadcast('watch.integrationHistory', { clientAction, id: item._id, data: item, diff });
};

const _notifyOnLivechatDepartmentAgentChanged = async <T extends ILivechatDepartmentAgents>(
	data: Partial<T> & Pick<T, '_id' | 'agentId' | 'departmentId'>,
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	void api.broadcast('watch.livechatDepartmentAgents', { clientAction, id: data._id, data });
};

const _notifyOnLivechatDepartmentAgentChangedByDepartmentId = async <T extends ILivechatDepartmentAgents>(
	departmentId: T['departmentId'],
	clientAction: 'inserted' | 'updated' = 'updated',
): Promise<void> => {
	const items = LivechatDepartmentAgents.findByDepartmentId(departmentId, { projection: { _id: 1, agentId: 1, departmentId: 1 } });

	for await (const item of items) {
		void api.broadcast('watch.livechatDepartmentAgents', { clientAction, id: item._id, data: item });
	}
};

const _notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId = async <T extends ILivechatDepartmentAgents>(
	agentsIds: T['agentId'][],
	departmentId: T['departmentId'],
	clientAction: 'inserted' | 'updated' = 'updated',
): Promise<void> => {
	const items = LivechatDepartmentAgents.findByAgentsAndDepartmentId(agentsIds, departmentId, {
		projection: { _id: 1, agentId: 1, departmentId: 1 },
	});

	for await (const item of items) {
		void api.broadcast('watch.livechatDepartmentAgents', { clientAction, id: item._id, data: item });
	}
};

const _notifyOnSettingChanged = async (
	setting: ISetting & { editor?: ISettingColor['editor'] },
	clientAction: ClientAction = 'updated',
): Promise<void> => {
	void api.broadcast('watch.settings', { clientAction, setting });
};

const _notifyOnSettingChangedById = async (id: ISetting['_id'], clientAction: ClientAction = 'updated'): Promise<void> => {
	const item = clientAction === 'removed' ? await Settings.trashFindOneById(id) : await Settings.findOneById(id);

	if (!item) {
		return;
	}

	void api.broadcast('watch.settings', { clientAction, setting: item });
};

type NotifyUserChange = {
	id: IUser['_id'];
	clientAction: 'inserted' | 'removed' | 'updated';
	data?: IUser;
	diff?: Record<string, any>;
	unset?: Record<string, number>;
};

const _notifyOnUserChange = async ({ clientAction, id, data, diff, unset }: NotifyUserChange) => {
	if (clientAction === 'removed') {
		void api.broadcast('watch.users', { clientAction, id });
		return;
	}

	if (clientAction === 'inserted') {
		void api.broadcast('watch.users', { clientAction, id, data: data! });
		return;
	}

	void api.broadcast('watch.users', { clientAction, diff: diff!, unset: unset || {}, id });
};

/**
 * Calls the callback only if DB Watchers are disabled
 */
const _notifyOnUserChangeAsync = async (cb: () => Promise<NotifyUserChange | NotifyUserChange[] | void>) => {
	const result = await cb();
	if (!result) {
		return;
	}

	if (Array.isArray(result)) {
		result.forEach((n) => _notifyOnUserChange(n));
		return;
	}

	return _notifyOnUserChange(result);
};

// TODO this may be only useful on 'inserted'
const _notifyOnUserChangeById = async ({ clientAction, id }: { id: IUser['_id']; clientAction: 'inserted' | 'removed' | 'updated' }) => {
	const user = await Users.findOneById(id);
	if (!user) {
		return;
	}

	void _notifyOnUserChange({ id, clientAction, data: user });
};

export const notifyOnLivechatPriorityChanged = withDbWatcherCheck(_notifyOnLivechatPriorityChanged);
export const notifyOnRoomChanged = withDbWatcherCheck(_notifyOnRoomChanged);
export const notifyOnRoomChangedById = withDbWatcherCheck(_notifyOnRoomChangedById);
export const notifyOnRoomChangedByUsernamesOrUids = withDbWatcherCheck(_notifyOnRoomChangedByUsernamesOrUids);
export const notifyOnRoomChangedByUserDM = withDbWatcherCheck(_notifyOnRoomChangedByUserDM);
export const notifyOnPermissionChanged = withDbWatcherCheck(_notifyOnPermissionChanged);
export const notifyOnPermissionChangedById = withDbWatcherCheck(_notifyOnPermissionChangedById);
export const notifyOnPbxEventChangedById = withDbWatcherCheck(_notifyOnPbxEventChangedById);
export const notifyOnRoleChanged = withDbWatcherCheck(_notifyOnRoleChanged);
export const notifyOnRoleChangedById = withDbWatcherCheck(_notifyOnRoleChangedById);
export const notifyOnLoginServiceConfigurationChanged = withDbWatcherCheck(_notifyOnLoginServiceConfigurationChanged);
export const notifyOnLoginServiceConfigurationChangedByService = withDbWatcherCheck(_notifyOnLoginServiceConfigurationChangedByService);
export const notifyOnIntegrationChanged = withDbWatcherCheck(_notifyOnIntegrationChanged);
export const notifyOnIntegrationChangedById = withDbWatcherCheck(_notifyOnIntegrationChangedById);
export const notifyOnIntegrationChangedByUserId = withDbWatcherCheck(_notifyOnIntegrationChangedByUserId);
export const notifyOnIntegrationChangedByChannels = withDbWatcherCheck(_notifyOnIntegrationChangedByChannels);
export const notifyOnEmailInboxChanged = withDbWatcherCheck(_notifyOnEmailInboxChanged);
export const notifyOnLivechatInquiryChanged = withDbWatcherCheck(_notifyOnLivechatInquiryChanged);
export const notifyOnLivechatInquiryChangedById = withDbWatcherCheck(_notifyOnLivechatInquiryChangedById);
export const notifyOnLivechatInquiryChangedByRoom = withDbWatcherCheck(_notifyOnLivechatInquiryChangedByRoom);
export const notifyOnLivechatInquiryChangedByToken = withDbWatcherCheck(_notifyOnLivechatInquiryChangedByToken);
export const notifyOnIntegrationHistoryChanged = withDbWatcherCheck(_notifyOnIntegrationHistoryChanged);
export const notifyOnIntegrationHistoryChangedById = withDbWatcherCheck(_notifyOnIntegrationHistoryChangedById);
export const notifyOnLivechatDepartmentAgentChanged = withDbWatcherCheck(_notifyOnLivechatDepartmentAgentChanged);
export const notifyOnLivechatDepartmentAgentChangedByDepartmentId = withDbWatcherCheck(
	_notifyOnLivechatDepartmentAgentChangedByDepartmentId,
);
export const notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId = withDbWatcherCheck(
	_notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId,
);
export const notifyOnSettingChanged = withDbWatcherCheck(_notifyOnSettingChanged);
export const notifyOnSettingChangedById = withDbWatcherCheck(_notifyOnSettingChangedById);
export const notifyOnUserChange = withDbWatcherCheck(_notifyOnUserChange);
export const notifyOnUserChangeAsync = withDbWatcherCheck(_notifyOnUserChangeAsync);
export const notifyOnUserChangeById = withDbWatcherCheck(_notifyOnUserChangeById);
