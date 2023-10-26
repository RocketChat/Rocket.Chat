import type { IUser, IUserEmail } from '@rocket.chat/core-typings';
import { isUserFederated, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Rooms, Users, Subscriptions } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { closeOmnichannelConversations } from './closeOmnichannelConversations';
import { shouldRemoveOrChangeOwner, getSubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';
import { getUserSingleOwnedRooms } from './getUserSingleOwnedRooms';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';

async function reactivateDirectConversations(userId: string) {
	// since both users can be deactivated at the same time, we should just reactivate rooms if both users are active
	// for that, we need to fetch the direct messages, fetch the users involved and then the ids of rooms we can reactivate
	const directConversations = await Rooms.getDirectConversationsByUserId(userId, {
		projection: { _id: 1, uids: 1, t: 1 },
	}).toArray();

	const userIds = directConversations.reduce<string[]>((acc: string[], r) => {
		if (isDirectMessageRoom(r)) {
			acc.push(...r.uids);
		}
		return acc;
	}, []);
	const uniqueUserIds = [...new Set(userIds)];
	const activeUsers = await Users.findActiveByUserIds(uniqueUserIds, { projection: { _id: 1 } }).toArray();
	const activeUserIds = activeUsers.map((u: IUser) => u._id);
	const roomsToReactivate = directConversations.reduce((acc: string[], room) => {
		const otherUserId = isDirectMessageRoom(room) ? room.uids.find((u: string) => u !== userId) : undefined;
		if (otherUserId && activeUserIds.includes(otherUserId)) {
			acc.push(room._id);
		}
		return acc;
	}, []);

	await Rooms.setDmReadOnlyByUserId(userId, roomsToReactivate, false, false);
}

export async function setUserActiveStatus(userId: string, active: boolean, confirmRelinquish = false): Promise<boolean | undefined> {
	check(userId, String);
	check(active, Boolean);

	const user = await Users.findOneById(userId);

	if (!user) {
		return false;
	}

	if (isUserFederated(user)) {
		throw new Meteor.Error('error-user-is-federated', 'Cannot change federated users status', {
			method: 'setUserActiveStatus',
		});
	}

	// Users without username can't do anything, so there is no need to check for owned rooms
	if (user.username != null && !active) {
		const userAdmin = await Users.findOneAdmin(userId || '');
		const adminsCount = await Users.countActiveUsersInRoles(['admin']);
		if (userAdmin && adminsCount === 1) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without an active admin is not allowed', {
				method: 'removeUserFromRole',
				action: 'Remove_last_admin',
			});
		}

		const subscribedRooms = await getSubscribedRoomsForUserWithDetails(userId);
		// give omnichannel rooms a special treatment :)
		const chatSubscribedRooms = subscribedRooms.filter(({ t }) => t !== 'l');
		const livechatSubscribedRooms = subscribedRooms.filter(({ t }) => t === 'l');

		if (shouldRemoveOrChangeOwner(chatSubscribedRooms) && !confirmRelinquish) {
			const rooms = await getUserSingleOwnedRooms(chatSubscribedRooms as []);
			throw new Meteor.Error('user-last-owner', '', rooms);
		}

		// We don't want one killing the other :)
		await Promise.allSettled([
			closeOmnichannelConversations(user, livechatSubscribedRooms),
			relinquishRoomOwnerships(user._id, chatSubscribedRooms, false),
		]);
	}

	if (active && !user.active) {
		await callbacks.run('beforeActivateUser', user);
	}

	await Users.setUserActive(userId, active);

	if (active && !user.active) {
		await callbacks.run('afterActivateUser', user);
	}

	if (!active && user.active) {
		await callbacks.run('afterDeactivateUser', user);
	}

	if (user.username) {
		await Subscriptions.setArchivedByUsername(user.username, !active);
	}

	if (active === false) {
		await Users.unsetLoginTokens(userId);
		await Rooms.setDmReadOnlyByUserId(userId, undefined, true, false);
	} else {
		await Users.unsetReason(userId);
		await reactivateDirectConversations(userId);
	}
	if (active && !settings.get('Accounts_Send_Email_When_Activating')) {
		return true;
	}
	if (!active && !settings.get('Accounts_Send_Email_When_Deactivating')) {
		return true;
	}
	if (!user.emails || !Array.isArray(user.emails) || user.emails.length === 0) {
		return true;
	}

	const destinations = user.emails.map((email: IUserEmail) => `${user.name || user.username}<${email.address}>`);

	type UserActivated = {
		subject: (params: { active: boolean }) => string;
		html: (params: { active: boolean; name: string; username: string }) => string;
	};
	const { subject, html } = (Accounts.emailTemplates as unknown as { userActivated: UserActivated }).userActivated;
	const email = {
		to: String(destinations),
		from: String(settings.get('From_Email')),
		subject: subject({ active } as any),
		html: html({
			active,
			name: user.name,
			username: user.username,
		} as any),
	};

	void Mailer.sendNoWrap(email);
}
