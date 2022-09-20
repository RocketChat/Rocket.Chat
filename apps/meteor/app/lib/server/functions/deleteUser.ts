import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { FileProp } from '@rocket.chat/core-typings';
import { Integrations, FederationServers, LivechatVisitors } from '@rocket.chat/models';

import { FileUpload } from '../../../file-upload/server';
import { Users, Subscriptions, Messages, Rooms, LivechatDepartmentAgents } from '../../../models/server';
import { settings } from '../../../settings/server';
import { updateGroupDMsName } from './updateGroupDMsName';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';
import { getSubscribedRoomsForUserWithDetails, shouldRemoveOrChangeOwner } from './getRoomsWithSingleOwner';
import { getUserSingleOwnedRooms } from './getUserSingleOwnedRooms';
import { api } from '../../../../server/sdk/api';
import { LivechatUnitMonitors } from '../../../../ee/app/models/server';

export async function deleteUser(userId: string, confirmRelinquish = false): Promise<void> {
	const user = Users.findOneById(userId, {
		fields: { username: 1, avatarOrigin: 1, federation: 1, roles: 1 },
	});

	if (!user) {
		return;
	}

	if (user.federation) {
		const existingSubscriptions = Subscriptions.find({ 'u._id': user._id }).count();

		if (existingSubscriptions > 0) {
			throw new Meteor.Error('FEDERATION_Error_user_is_federated_on_rooms');
		}
	}

	const subscribedRooms = getSubscribedRoomsForUserWithDetails(userId);

	if (shouldRemoveOrChangeOwner(subscribedRooms) && !confirmRelinquish) {
		const rooms = getUserSingleOwnedRooms(subscribedRooms);
		throw new Meteor.Error('user-last-owner', '', rooms);
	}

	// Users without username can't do anything, so there is nothing to remove
	if (user.username != null) {
		await relinquishRoomOwnerships(userId, subscribedRooms);

		const messageErasureType = settings.get('Message_ErasureType');
		switch (messageErasureType) {
			case 'Delete':
				const store = FileUpload.getStore('Uploads');
				Messages.findFilesByUserId(userId).forEach(function ({ file }: { file: FileProp }) {
					store.deleteById(file._id);
				});
				Messages.removeByUserId(userId);
				break;
			case 'Unlink':
				const rocketCat = Users.findOneById('rocket.cat');
				const nameAlias = TAPi18n.__('Removed_User');
				Messages.unlinkUserId(userId, rocketCat._id, rocketCat.username, nameAlias);
				break;
		}

		Rooms.updateGroupDMsRemovingUsernamesByUsername(user.username, userId); // Remove direct rooms with the user
		Rooms.removeDirectRoomContainingUsername(user.username); // Remove direct rooms with the user

		Subscriptions.removeByUserId(userId); // Remove user subscriptions

		if (user.roles.includes('livechat-agent')) {
			// Remove user as livechat agent
			LivechatDepartmentAgents.removeByAgentId(userId);
			await LivechatVisitors.removeContactManagerByUsername(user.username);
		}

		if (user.roles.includes('livechat-monitor')) {
			// Remove user as Unit Monitor
			LivechatUnitMonitors.removeByMonitorId(userId);
			await LivechatVisitors.removeContactManagerByUsername(user.username);
		}

		// removes user's avatar
		if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url' || user.avatarOrigin === 'rest') {
			FileUpload.getStore('Avatars').deleteByName(user.username);
		}

		await Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.

		// Don't broadcast user.deleted for Erasure Type of 'Keep' so that messages don't disappear from logged in sessions
		if (messageErasureType !== 'Keep') {
			api.broadcast('user.deleted', user);
		}
	}

	// Remove user from users database
	Users.removeById(userId);

	// update name and fname of group direct messages
	updateGroupDMsName(user);

	// Refresh the servers list
	await FederationServers.refreshServers();
}
