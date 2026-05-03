import { api, Message, Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';
import { beforeChangeRoomRole } from '../lib/callbacks/beforeChangeRoomRole';
import { syncRoomRolePriorityForUserAndRoom } from '../lib/roles/syncRoomRolePriority';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		removeRoomImportantMessageMarker(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

export const removeRoomImportantMessageMarker = async (
	fromUserId: IUser['_id'],
	rid: IRoom['_id'],
	userId: IUser['_id'],
): Promise<boolean> => {
	check(rid, String);
	check(userId, String);

	console.log('[removeRoomImportantMessageMarker] Starting:', { fromUserId, rid, userId });

	const room = await Rooms.findOneById(rid, { projection: { t: 1 } });
	if (!room) {
		console.error('[removeRoomImportantMessageMarker] Room not found:', rid);
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'removeRoomImportantMessageMarker',
		});
	}

	if (!(await hasPermissionAsync(fromUserId, 'set-important-message-marker', rid))) {
		console.error('[removeRoomImportantMessageMarker] Permission denied:', { fromUserId, rid });
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'removeRoomImportantMessageMarker',
		});
	}

	const user = await Users.findOneById(userId);
	if (!user?.username) {
		console.error('[removeRoomImportantMessageMarker] User not found:', userId);
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'removeRoomImportantMessageMarker',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (!subscription) {
		console.error('[removeRoomImportantMessageMarker] Subscription not found:', { rid, userId });
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'removeRoomImportantMessageMarker',
		});
	}

	if (!Array.isArray(subscription.roles) || !subscription.roles.includes('important-message-marker')) {
		console.error('[removeRoomImportantMessageMarker] User does not have role:', { rid, userId });
		throw new Meteor.Error('error-user-does-not-have-role', 'User does not have the role', {
			method: 'removeRoomImportantMessageMarker',
		});
	}

	await beforeChangeRoomRole.run({ fromUserId, userId, room, role: 'user' });

	const removeRoleResponse = await Subscriptions.removeRoleById(subscription._id, 'important-message-marker');
	await syncRoomRolePriorityForUserAndRoom(
		userId,
		rid,
		subscription.roles?.filter((r) => r !== 'important-message-marker') || [],
	);

	if (removeRoleResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	const fromUser = await Users.findOneById(fromUserId);
	if (!fromUser) {
		console.error('[removeRoomImportantMessageMarker] FromUser not found:', fromUserId);
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'removeRoomImportantMessageMarker',
		});
	}

	await Message.saveSystemMessage('subscription-role-removed', rid, user.username, fromUser, { role: 'important-message-marker' });

	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.removeRolesFromMember(team._id, userId, ['important-message-marker']);
	}

	const event = {
		type: 'removed',
		_id: 'important-message-marker',
		u: {
			_id: user._id,
			username: user.username,
			name: user.name,
		},
		scope: rid,
	} as const;

	if (settings.get('UI_DisplayRoles')) {
		void api.broadcast('user.roleUpdate', event);
	}

	void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: fromUserId });

	console.log('[removeRoomImportantMessageMarker] Role removed successfully:', { rid, userId });
	return true;
};

Meteor.methods<ServerMethods>({
	async removeRoomImportantMessageMarker(rid, userId) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomImportantMessageMarker',
			});
		}

		return removeRoomImportantMessageMarker(uid, rid, userId);
	},
});