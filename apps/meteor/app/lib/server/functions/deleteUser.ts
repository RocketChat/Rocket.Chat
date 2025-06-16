import { Apps, AppEvents } from '@rocket.chat/apps';
import { api, Federation, FederationEE, License } from '@rocket.chat/core-services';
import { isUserFederated, type IUser } from '@rocket.chat/core-typings';
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
	MatrixBridgedUser,
} from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { getSubscribedRoomsForUserWithDetails, shouldRemoveOrChangeOwner } from './getRoomsWithSingleOwner';
import { getUserSingleOwnedRooms } from './getUserSingleOwnedRooms';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';
import { updateGroupDMsName } from './updateGroupDMsName';
import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { VerificationStatus } from '../../../../server/services/federation/infrastructure/matrix/helpers/MatrixIdVerificationTypes';
import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import {
	notifyOnRoomChangedById,
	notifyOnIntegrationChangedByUserId,
	notifyOnLivechatDepartmentAgentChanged,
	notifyOnUserChange,
} from '../lib/notifyListener';

export async function deleteUser(userId: string, confirmRelinquish = false, deletedBy?: IUser['_id']): Promise<void> {
	if (userId === 'rocket.cat') {
		throw new Meteor.Error('error-action-not-allowed', 'Deleting the rocket.cat user is not allowed', {
			method: 'deleteUser',
			action: 'Delete_user',
		});
	}

	const user = await Users.findOneById(userId, {
		projection: { username: 1, avatarOrigin: 1, roles: 1, federated: 1 },
	});

	if (!user) {
		return;
	}

	if (isUserFederated(user)) {
		const service = (await License.hasValidLicense()) ? FederationEE : Federation;

		const result = await service.verifyMatrixIds([user.username as string]);

		if (result.get(user.username as string) === VerificationStatus.VERIFIED) {
			throw new Meteor.Error('error-not-allowed', 'Deleting federated, external user is not allowed', {
				method: 'deleteUser',
			});
		}
	} else {
		const remoteUser = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userId);
		if (remoteUser) {
			throw new Meteor.Error('error-not-allowed', 'User participated in federation, this user can only be deactivated permanently', {
				method: 'deleteUser',
			});
		}
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

		const rids = subscribedRooms.map((room) => room.rid);
		void notifyOnRoomChangedById(rids);

		await Subscriptions.removeByUserId(userId);

		// Remove user as livechat agent
		if (user.roles.includes('livechat-agent')) {
			const departmentAgents = await LivechatDepartmentAgents.findByAgentId(userId).toArray();

			const { deletedCount } = await LivechatDepartmentAgents.removeByAgentId(userId);

			if (deletedCount > 0) {
				departmentAgents.forEach((depAgent) => {
					void notifyOnLivechatDepartmentAgentChanged(
						{
							_id: depAgent._id,
							agentId: userId,
							departmentId: depAgent.departmentId,
						},
						'removed',
					);
				});
			}
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

		// Disables all the integrations which rely on the user being deleted.
		await Integrations.disableByUserId(userId);
		void notifyOnIntegrationChangedByUserId(userId);

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

	// App IPostUserDeleted event hook
	if (deletedBy) {
		await Apps.self?.triggerEvent(AppEvents.IPostUserDeleted, { user, performedBy: await Users.findOneById(deletedBy) });
	}

	// update name and fname of group direct messages
	await updateGroupDMsName(user);

	// Refresh the servers list
	await FederationServers.refreshServers();

	void notifyOnUserChange({ clientAction: 'removed', id: user._id });

	await callbacks.run('afterDeleteUser', user);
}
