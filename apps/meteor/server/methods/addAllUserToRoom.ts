import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { Users, Rooms, Subscriptions, Messages } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { callbacks } from '../../lib/callbacks';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addAllUserToRoom(rid: IRoom['_id'], activeUsersOnly?: boolean): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async addAllUserToRoom(rid, activeUsersOnly = false) {
		check(rid, String);
		check(activeUsersOnly, Boolean);

		if (!this.userId || !(await hasPermissionAsync(this.userId, 'add-all-to-room'))) {
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

		const userCursor: Mongo.Cursor<IUser> = Users.find(userFilter);
		const usersCount = userCursor.count();
		if (usersCount > settings.get<number>('API_User_Limit')) {
			throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
				method: 'addAllToRoom',
			});
		}

		const room = Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addAllToRoom',
			});
		}

		const users = userCursor.fetch();
		const now = new Date();
		users.forEach(function (user) {
			const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
			if (subscription != null) {
				return;
			}
			callbacks.run('beforeJoinRoom', user, room);
			Subscriptions.createWithRoomAndUser(room, user, {
				ts: now,
				open: true,
				alert: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
			});
			Messages.createUserJoinWithRoomIdAndUser(rid, user, {
				ts: now,
			});
			return callbacks.run('afterJoinRoom', user, room);
		});
		return true;
	},
});
