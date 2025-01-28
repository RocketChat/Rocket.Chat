import { Message } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';
import { getDefaultSubscriptionPref } from '../../app/utils/lib/getDefaultSubscriptionPref';
import { callbacks } from '../../lib/callbacks';
import { getSubscriptionAutotranslateDefaultConfig } from '../lib/getSubscriptionAutotranslateDefaultConfig';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addAllUserToRoom(rid: IRoom['_id'], activeUsersOnly?: boolean): Promise<true>;
	}
}

export const addAllUserToRoomFn = async (userId: string, rid: IRoom['_id'], activeUsersOnly = false): Promise<true> => {
	check(rid, String);
	check(activeUsersOnly, Boolean);

	if (!(await hasPermissionAsync(userId, 'add-all-to-room'))) {
		throw new Meteor.Error(403, 'Access to Method Forbidden', {
			method: 'addAllToRoom',
		});
	}

	const userFilter: {
		active?: boolean;
	} = {};
	if (activeUsersOnly === true) {
		userFilter.active = true;
	}

	const users = await Users.find(userFilter).toArray();
	if (users.length > settings.get<number>('API_User_Limit')) {
		throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
			method: 'addAllToRoom',
		});
	}

	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addAllToRoom',
		});
	}

	const now = new Date();
	for await (const user of users) {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
		if (subscription != null) {
			continue;
		}
		await callbacks.run('beforeJoinRoom', user, room);
		const autoTranslateConfig = getSubscriptionAutotranslateDefaultConfig(user);
		const { insertedId } = await Subscriptions.createWithRoomAndUser(room, user, {
			ts: now,
			open: true,
			alert: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			...autoTranslateConfig,
			...getDefaultSubscriptionPref(user),
		});
		if (insertedId) {
			void notifyOnSubscriptionChangedById(insertedId, 'inserted');
		}
		await Message.saveSystemMessage('uj', rid, user.username || '', user, { ts: now });
		await callbacks.run('afterJoinRoom', user, room);
	}
	return true;
};

Meteor.methods<ServerMethods>({
	async addAllUserToRoom(rid, activeUsersOnly = false) {
		if (!this.userId) {
			throw new Meteor.Error(403, 'Access to Method Forbidden', {
				method: 'addAllToRoom',
			});
		}

		return addAllUserToRoomFn(this.userId, rid, activeUsersOnly);
	},
});
