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
	IEmailInbox,
	IIntegrationHistory,
	AtLeast,
	ISubscription,
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
	Subscriptions,
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

// export async function notifyOnSubscriptionChanged(
// 	subscription: ISubscription,
// 	clientAction: ClientAction = 'updated',
// ): Promise<void> {
// 	if (!dbWatchersDisabled) {
// 		return;
// 	}

// 	void api.broadcast('watch.subscriptions', { clientAction, subscription });
// }

// export async function notifyOnSubscriptionChangedById(
// 	_id: ISubscription['_id'],
// 	clientAction: ClientAction = 'updated',
// ): Promise<void> {
// 	if (!dbWatchersDisabled) {
// 		return;
// 	}

// 	const subscription = clientAction === 'removed' ? await Subscriptions.trashFindOneById(_id) : await Subscriptions.findOneById(_id);

// 	if (!subscription) {
// 		return;
// 	}

// 	void api.broadcast('watch.subscriptions', { clientAction, subscription });
// }

export async function notifyOnSubscriptionChangedByUserAndRoomId(
	uid: ISubscription['u']['_id'],
	rid: ISubscription['rid'],
	clientAction: ClientAction = 'updated',
	// diff?: Partial<ISubscription>,
): Promise<void> {
	// || !hasSubscriptionFields(diff)
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions =
		clientAction === 'removed'
			? Subscriptions.trashFind({ rid, 'u._id': uid }, { projection: subscriptionFields })
			: Subscriptions.findByUserIdAndRoomIds(uid, [rid], { projection: subscriptionFields });

	if (!subscriptions) {
		return;
	}

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedById(id: ISubscription['_id'], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscription = clientAction === 'removed' ? await Subscriptions.trashFindOneById(id) : await Subscriptions.findOneById(id);

	if (!subscription) {
		return;
	}

	void api.broadcast('watch.subscriptions', { clientAction, subscription });
}

export async function notifyOnSubscriptionChangedByRoomIdExcludingUserIds(
	rid: ISubscription['rid'],
	uids: ISubscription['u']['_id'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions = Subscriptions.findByRoomIdExcludingUserIds(rid, uids, { projection: subscriptionFields });

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByUserPreferences(
	uid: ISubscription['u']['_id'],
	notificationOriginField: keyof ISubscription,
	originFieldNotEqualValue: 'user' | 'subscription',
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions = Subscriptions.findByUserPreferences(uid, notificationOriginField, originFieldNotEqualValue, {
		projection: subscriptionFields,
	});

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByRoomId(
	rid: ISubscription['rid'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions =
		clientAction === 'removed'
			? Subscriptions.trashFind({ rid }, { projection: subscriptionFields })
			: Subscriptions.findByRoomId(rid, { projection: subscriptionFields });

	if (!subscriptions) {
		return;
	}

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByToken(token: string, clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions =
		clientAction === 'removed'
			? Subscriptions.trashFind({ 'v.token': token }, { projection: subscriptionFields })
			: Subscriptions.findByToken(token, { projection: subscriptionFields });

	if (!subscriptions) {
		return;
	}

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByAutoTranslateAndUserId(
	uid: ISubscription['u']['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions = Subscriptions.findByAutoTranslateAndUserId(uid, true, { projection: subscriptionFields });

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByUserIdAndRoomType(
	uid: ISubscription['u']['_id'],
	t: ISubscription['t'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions = Subscriptions.findByUserIdAndRoomType(uid, t, { projection: subscriptionFields });

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByNameAndRoomType(
	name?: ISubscription['name'],
	fname?: ISubscription['fname'],
	t?: ISubscription['t'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions = Subscriptions.findByNameAndRoomType(name, fname, t, { projection: subscriptionFields });

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByUserId(
	uid: ISubscription['u']['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions = Subscriptions.findByUserId(uid, { projection: subscriptionFields });

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

export async function notifyOnSubscriptionChangedByRoomIdAndUserIds(
	rid: ISubscription['rid'],
	uids: ISubscription['u']['_id'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const subscriptions =
		clientAction === 'removed'
			? Subscriptions.trashFind({ rid, 'u._id': { $in: uids } }, { projection: subscriptionFields })
			: Subscriptions.findByRoomIdAndUserIds(rid, uids, { projection: subscriptionFields });

	if (!subscriptions) {
		return;
	}

	for await (const subscription of subscriptions) {
		void api.broadcast('watch.subscriptions', { clientAction, subscription });
	}
}

const subscriptionFields = {
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
	audioNotificationValue: 1,
	desktopNotifications: 1,
	mobilePushNotifications: 1,
	emailNotifications: 1,
	desktopPrefOrigin: 1,
	mobilePrefOrigin: 1,
	emailPrefOrigin: 1,
	unreadAlert: 1,
	// _updatedAt: 1,
	blocked: 1,
	blocker: 1,
	autoTranslate: 1,
	autoTranslateLanguage: 1,
	disableNotifications: 1,
	hideUnreadStatus: 1,
	hideMentionStatus: 1,
	muteGroupMentions: 1,
	ignored: 1,
	E2EKey: 1,
	E2ESuggestedKey: 1,
	tunread: 1,
	tunreadGroup: 1,
	tunreadUser: 1,

	// Omnichannel fields
	department: 1,
	v: 1,
	onHold: 1,
};

// function hasKeys(requiredKeys: string[]): (data?: Record<string, any>) => boolean {
// 	return (data?: Record<string, any>): boolean => {
// 		if (!data) {
// 			return false;
// 		}

// 		return requiredKeys.some((key) => key in data);
// 	};
// }

// const hasSubscriptionFields = hasKeys(Object.keys(subscriptionFields));
