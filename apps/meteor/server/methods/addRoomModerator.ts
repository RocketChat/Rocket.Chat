import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { api, Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { Users, Subscriptions, Messages, Rooms } from '../../app/models/server';
import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addRoomModerator(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async addRoomModerator(rid, userId) {
		check(rid, String);
		check(userId, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		const room = Rooms.findOneById(rid, { fields: { t: 1, federated: 1 } });
		if (!(await hasPermissionAsync(uid, 'set-moderator', rid)) && !isRoomFederated(room)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addRoomModerator',
			});
		}

		const user = Users.findOneById(userId);

		if (!user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'addRoomModerator',
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('moderator') === true) {
			throw new Meteor.Error('error-user-already-moderator', 'User is already a moderator', {
				method: 'addRoomModerator',
			});
		}

		Subscriptions.addRoleById(subscription._id, 'moderator');

		const fromUser = Users.findOneById(uid);

		Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
			role: 'moderator',
		});

		const team = await Team.getOneByMainRoomId(rid);
		if (team) {
			await Team.addRolesToMember(team._id, userId, ['moderator']);
		}

		const event = {
			type: 'added',
			_id: 'moderator',
			u: {
				_id: user._id,
				username: user.username,
				name: fromUser.name,
			},
			scope: rid,
		};

		if (settings.get<boolean>('UI_DisplayRoles')) {
			void api.broadcast('user.roleUpdate', event);
		}

		void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: uid });

		return true;
	},
});
