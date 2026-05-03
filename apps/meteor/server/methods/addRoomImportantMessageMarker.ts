import { api, Message, Team } from '@rocket.chat/core-services';
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
		addRoomImportantMessageMarker(rid: string, userId: string): boolean;
		removeRoomImportantMessageMarker(rid: string, userId: string): boolean;
	}
}

export const addRoomImportantMessageMarker = async (
	fromUserId: string,
	rid: string,
	userId: string,
): Promise<boolean> => {
	check(rid, String);
	check(userId, String);

	console.log('[addRoomImportantMessageMarker] Starting:', { fromUserId, rid, userId });

	const room = await Rooms.findOneById(rid, { projection: { t: 1 } });
	if (!room) {
		console.error('[addRoomImportantMessageMarker] Room not found:', rid);
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addRoomImportantMessageMarker',
		});
	}

	if (!(await hasPermissionAsync(fromUserId, 'set-important-message-marker', rid))) {
		console.error('[addRoomImportantMessageMarker] Permission denied:', { fromUserId, rid });
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'addRoomImportantMessageMarker',
		});
	}

	const user = await Users.findOneById(userId);
	if (!user?.username) {
		console.error('[addRoomImportantMessageMarker] User not found:', userId);
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'addRoomImportantMessageMarker',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (!subscription) {
		console.error('[addRoomImportantMessageMarker] Subscription not found:', { rid, userId });
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'addRoomImportantMessageMarker',
		});
	}

	if (subscription.roles?.includes('important-message-marker')) {
		console.log('[addRoomImportantMessageMarker] User already has role:', { rid, userId });
		return true;
	}

	await beforeChangeRoomRole.run({ fromUserId, userId, room, role: 'user' });

	await Subscriptions.addRoleById(subscription._id, 'important-message-marker');
	
	await syncRoomRolePriorityForUserAndRoom(
		userId,
		rid,
		subscription.roles?.concat(['important-message-marker']) || ['important-message-marker'],
	);

	if (subscription._id) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	const fromUser = await Users.findOneById(fromUserId);

	await Message.saveSystemMessage(
		'subscription-role-added',
		rid,
		user.username,
		fromUser!,
		{ role: 'important-message-marker' },
	);

	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.addRolesToMember(team._id, userId, ['important-message-marker']);
	}

	const event = {
		type: 'added',
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

	console.log('[addRoomImportantMessageMarker] Role added successfully:', { rid, userId });
	return true;
};

// Register Meteor method
Meteor.methods({
	async addRoomImportantMessageMarker(rid: string, userId: string) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomImportantMessageMarker',
			});
		}

		return await addRoomImportantMessageMarker(uid, rid, userId);
	},
});
