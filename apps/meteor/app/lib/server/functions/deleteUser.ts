import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import {
	Integrations,
	FederationServers,
	LivechatVisitors,
	LivechatDepartmentAgents,
	Messages,
	Rooms,
	Subscriptions,
	Users,
	ReadReceipts,
	LivechatUnitMonitors,
	ModerationReports,
} from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { getSubscribedRoomsForUserWithDetails, shouldRemoveOrChangeOwner } from './getRoomsWithSingleOwner';
import { getUserSingleOwnedRooms } from './getUserSingleOwnedRooms';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';
import { updateGroupDMsName } from './updateGroupDMsName';

export async function deleteUser(userId: string, confirmRelinquish = false, deletedBy?: IUser['_id']): Promise<void> {
	const user = await Users.findOneById(userId, {
		projection: { username: 1, avatarOrigin: 1, roles: 1, federated: 1 },
	});

	if (!user) {
		return;
	}

	const subscribedRooms = await getSubscribedRoomsForUserWithDetails(userId);

	if (shouldRemoveOrChangeOwner(subscribedRooms) && !confirmRelinquish) {
		const rooms = await getUserSingleOwnedRooms(subscribedRooms);
		throw new Meteor.Error('user-last-owner', '', rooms);
	}

	// Users without username can't do anything, so there is nothing to remove
	if (user.username != null) {
		let userToReplaceWhenUnlinking: IUser | null = null;
		const nameAlias = i18n.t('Removed_User');
		await relinquishRoomOwnerships(userId, subscribedRooms);

		const messageErasureType = settings.get<'Delete' | 'Unlink' | 'Keep'>('Message_ErasureType');
		switch (messageErasureType) {
			case 'Delete':
				const store = FileUpload.getStore('Uploads');
				const cursor = Messages.findFilesByUserId(userId);

				for await (const { file } of cursor) {
					if (!file) {
						continue;
					}
					await store.deleteById(file._id);
				}

				await Messages.removeByUserId(userId);
				await ReadReceipts.removeByUserId(userId);

				await ModerationReports.hideMessageReportsByUserId(
					userId,
					deletedBy || userId,
					deletedBy === userId ? 'user deleted own account' : 'user account deleted',
					'DELETE_USER',
				);

				break;
			case 'Unlink':
				userToReplaceWhenUnlinking = await Users.findOneById('rocket.cat');
				if (!userToReplaceWhenUnlinking?._id || !userToReplaceWhenUnlinking?.username) {
					break;
				}
				await Messages.unlinkUserId(userId, userToReplaceWhenUnlinking?._id, userToReplaceWhenUnlinking?.username, nameAlias);
				break;
		}

		await Rooms.updateGroupDMsRemovingUsernamesByUsername(user.username, userId); // Remove direct rooms with the user
		await Rooms.removeDirectRoomContainingUsername(user.username); // Remove direct rooms with the user

		await Subscriptions.removeByUserId(userId); // Remove user subscriptions

		if (user.roles.includes('livechat-agent')) {
			// Remove user as livechat agent
			await LivechatDepartmentAgents.removeByAgentId(userId);
		}

		if (user.roles.includes('livechat-monitor')) {
			// Remove user as Unit Monitor
			await LivechatUnitMonitors.removeByMonitorId(userId);
		}

		// This is for compatibility. Since we allowed any user to be contact manager b4, we need to have the same logic
		// for deletion.
		await LivechatVisitors.removeContactManagerByUsername(user.username);

		// removes user's avatar
		if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url' || user.avatarOrigin === 'rest') {
			await FileUpload.getStore('Avatars').deleteByName(user.username);
		}

		await Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.

		// Don't broadcast user.deleted for Erasure Type of 'Keep' so that messages don't disappear from logged in sessions
		if (messageErasureType === 'Delete') {
			void api.broadcast('user.deleted', user, {
				messageErasureType,
			});
		}
		if (messageErasureType === 'Unlink' && userToReplaceWhenUnlinking) {
			void api.broadcast('user.deleted', user, {
				messageErasureType,
				replaceByUser: { _id: userToReplaceWhenUnlinking._id, username: userToReplaceWhenUnlinking?.username, alias: nameAlias },
			});
		}
	}

	// Remove user from users database
	await Users.removeById(userId);

	// update name and fname of group direct messages
	await updateGroupDMsName(user);

	// Refresh the servers list
	await FederationServers.refreshServers();

	await callbacks.run('afterDeleteUser', user);
}
