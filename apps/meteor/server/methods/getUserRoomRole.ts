import { Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		getUserRoomRole(rid: string, userId: string, role: string): boolean;
	}
}

Meteor.methods({
	async getUserRoomRole(rid: string, userId: string, role: string): Promise<boolean> {
		check(rid, String);
		check(userId, String);
		check(role, String);

		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUserRoomRole',
			});
		}

		if (currentUserId !== userId) {
			const canQueryOtherUserRoles = await hasPermissionAsync(currentUserId, 'set-important-message-marker', rid);

			if (!canQueryOtherUserRoles) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', {
					method: 'getUserRoomRole',
				});
			}
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		
		if (!subscription) {
			console.log('[getUserRoomRole] Subscription not found:', { rid, userId, role });
			return false;
		}

		const hasRole = subscription.roles?.includes(role) ?? false;
		console.log('[getUserRoomRole] Checked role:', { rid, userId, role, hasRole });
		return hasRole;
	},
});
