import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IPermission, IRocketChatRecord, IRoom, ISetting, IPbxEvent } from '@rocket.chat/core-typings';
import { Rooms, Permissions, Settings, PbxEvents } from '@rocket.chat/models';

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

export async function notifyOnSettingChangedById(sid: ISetting['_id'], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const setting = await Settings.findOneById(sid);

	if (setting) {
		void api.broadcast('watch.settings', { clientAction, setting });
	}
}

export async function notifyOnPermissionChangedById(pid: IPermission['_id'], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const permission = await Permissions.findOneById(pid);

	if (permission) {
		void api.broadcast('permission.changed', { clientAction, data: permission });
	}

	if (permission?.level === 'settings' && permission?.settingId) {
		void notifyOnSettingChangedById(permission.settingId);
	}
}

export async function notifyOnPermissionChangedByGroupPermissionId(
	pid: IPermission['groupPermissionId'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const permission = await Permissions.findOneByGroupPermissionId(pid);

	if (permission) {
		void api.broadcast('permission.changed', { clientAction, data: permission });
	}

	if (permission?.level === 'settings' && permission?.settingId) {
		void notifyOnSettingChangedById(permission.settingId);
	}
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
