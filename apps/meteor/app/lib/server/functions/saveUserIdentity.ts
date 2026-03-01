import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Messages, VideoConference, LivechatDepartmentAgents, Rooms, Subscriptions, Users, CallHistory } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { setRealName } from './setRealName';
import { _setUsername } from './setUsername';
import { updateGroupDMsName } from './updateGroupDMsName';
import { validateName } from './validateName';
import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { FileUpload } from '../../../file-upload/server';
import {
	notifyOnRoomChangedByUsernamesOrUids,
	notifyOnSubscriptionChangedByUserId,
	notifyOnSubscriptionChangedByNameAndRoomType,
} from '../lib/notifyListener';

/**
 *
 * @param {object} changes changes to the user
 */

export async function saveUserIdentity({
	_id,
	name: rawName,
	username: rawUsername,
	updateUsernameInBackground = false,
	updater,
	session,
}: {
	_id: string;
	name?: string;
	username?: string;
	updateUsernameInBackground?: boolean; // TODO: remove this
	updater?: Updater<IUser>;
	session?: ClientSession;
}) {
	if (!_id) {
		return false;
	}

	const hasNameInput = typeof rawName === 'string';
	const hasUsernameInput = typeof rawUsername === 'string';
	const name = hasNameInput ? rawName.trim() : undefined;
	const username = hasUsernameInput ? rawUsername.trim() : undefined;

	const user = await Users.findOneById(_id, { session });
	if (!user) {
		return false;
	}

	const previousUsername = user.username;
	const previousName = user.name;
	const nameChanged = hasNameInput && previousName !== name;
	const usernameChanged = hasUsernameInput && previousUsername !== username;

	if (hasUsernameInput && usernameChanged) {
		const currentUsername = username as string;

		if (!validateName(currentUsername)) {
			return false;
		}

		if (!(await _setUsername(_id, currentUsername, user, updater, session))) {
			return false;
		}
		user.username = currentUsername;
	}

	if (hasNameInput && nameChanged) {
		const currentName = name as string;

		if (!(await setRealName(_id, currentName, user, updater, session))) {
			return false;
		}
	}

	const updateReferences = async () => {
		if (previousUsername) {
			const handleUpdateParams = {
				username,
				previousUsername,
				hasUsernameInput,
				usernameChanged,
				user,
				name,
				previousName,
				hasNameInput,
				nameChanged,
			};
			if (updateUsernameInBackground) {
				setImmediate(async () => {
					try {
						await updateUsernameReferences(handleUpdateParams);
					} catch (err) {
						SystemLogger.error({ err });
					}
				});
			} else {
				await updateUsernameReferences(handleUpdateParams);
			}
		}
	};

	await onceTransactionCommitedSuccessfully(updateReferences, session);

	return true;
}

async function updateUsernameReferences({
	username,
	previousUsername,
	hasUsernameInput,
	usernameChanged,
	user,
	name,
	previousName,
	hasNameInput,
	nameChanged,
}: {
	username?: string;
	previousUsername: string;
	hasUsernameInput: boolean;
	usernameChanged: boolean;
	user: IUser;
	name?: string;
	previousName: string | undefined;
	hasNameInput: boolean;
	nameChanged: boolean;
}): Promise<void> {
	if (usernameChanged && hasUsernameInput) {
		const currentUsername = username ?? previousUsername;
		const fileStore = FileUpload.getStore('Avatars');
		const previousFile = await fileStore.model.findOneByName(previousUsername);
		const file = await fileStore.model.findOneByName(currentUsername);
		if (file) {
			await fileStore.model.deleteFile(file._id);
		}
		if (previousFile) {
			await fileStore.model.updateFileNameById(previousFile._id, currentUsername);
		}

		await Messages.updateAllUsernamesByUserId(user._id, currentUsername);
		await Messages.updateUsernameOfEditByUserId(user._id, currentUsername);

		const cursor = Messages.findByMention(previousUsername);
		for await (const msg of cursor) {
			const updatedMsg = msg.msg.replace(new RegExp(`@${previousUsername}`, 'ig'), `@${currentUsername}`);
			await Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, currentUsername, updatedMsg);
		}

		const responses = await Promise.all([
			Rooms.replaceUsername(previousUsername, currentUsername),
			Rooms.replaceMutedUsername(previousUsername, currentUsername),
			Rooms.replaceUsernameOfUserByUserId(user._id, currentUsername),
			Subscriptions.setUserUsernameByUserId(user._id, currentUsername),
			LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(user._id, currentUsername),
		]);

		if (responses[3]?.modifiedCount) {
			void notifyOnSubscriptionChangedByUserId(user._id);
		}

		if (responses[0]?.modifiedCount || responses[1]?.modifiedCount || responses[2]?.modifiedCount) {
			void notifyOnRoomChangedByUsernamesOrUids([user._id], [previousUsername, currentUsername]);
		}
	}

	// update other references if either the name or username has changed
	if (usernameChanged || nameChanged) {
		const currentUsername = hasUsernameInput ? username : undefined;
		const currentName = hasNameInput ? name : undefined;

		// update name and fname of 1-on-1 direct messages
		const updateDirectNameResponse = await Subscriptions.updateDirectNameAndFnameByName(previousUsername, currentUsername, currentName);

		if (updateDirectNameResponse?.modifiedCount) {
			void notifyOnSubscriptionChangedByNameAndRoomType({
				t: 'd',
				name: currentUsername ?? previousUsername,
			});
		}

		// update name and fname of group direct messages
		await updateGroupDMsName(user);

		// update name and username of users on video conferences
		await VideoConference.updateUserReferences(user._id, currentUsername ?? previousUsername, currentName ?? previousName);

		// update name and username of users on call history
		await CallHistory.updateUserReferences(user._id, currentUsername ?? previousUsername, currentName ?? previousName);
	}
}
