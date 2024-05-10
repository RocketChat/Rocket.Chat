import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IPermission, IRocketChatRecord, IRoom, ISetting, IPbxEvent, IRole, IInstanceStatus } from '@rocket.chat/core-typings';
import { Rooms, Permissions, Settings, PbxEvents, Roles, InstanceStatus } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

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

export async function notifyOnInstanceStatusChangedById<T extends IInstanceStatus>(
	id: T['_id'],
	clientAction: 'inserted' | 'updated' | 'removed',
	data?: Record<string, unknown>,
	diff?: Record<string, unknown>,
) {
	if (!dbWatchersDisabled) {
		return;
	}

	const instanceStatus = await InstanceStatus.findOneById(id);

	if (instanceStatus) {
		void api.broadcast('watch.instanceStatus', { id, clientAction, data, diff });
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

	if (item) {
		void api.broadcast('watch.pbxevents', { clientAction, id, data: item });
	}
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
