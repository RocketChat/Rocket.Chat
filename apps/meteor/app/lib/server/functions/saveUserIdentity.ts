import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Messages, VideoConference, LivechatDepartmentAgents, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { _setRealName } from './setRealName';
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

	const name = String(rawName).trim();
	const username = String(rawUsername).trim();

	const user = await Users.findOneById(_id, { session });
	if (!user) {
		return false;
	}

	const previousUsername = user.username;
	const previousName = user.name;
	const nameChanged = previousName !== name;
	const usernameChanged = previousUsername !== username;

	if (typeof rawUsername !== 'undefined' && usernameChanged) {
		if (!validateName(username)) {
			return false;
		}

		if (!(await _setUsername(_id, username, user, updater, session))) {
			return false;
		}
		user.username = username;
	}

	if (typeof rawName !== 'undefined' && nameChanged) {
		if (!(await _setRealName(_id, name, user, updater, session))) {
			return false;
		}
	}

	const updateReferences = async () => {
		if (previousUsername) {
			const handleUpdateParams = {
				username,
				previousUsername,
				rawUsername,
				usernameChanged,
				user,
				name,
				previousName,
				rawName,
				nameChanged,
			};
			if (updateUsernameInBackground) {
				setImmediate(async () => {
					try {
						await updateUsernameReferences(handleUpdateParams);
					} catch (err) {
						SystemLogger.error(err);
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
	rawUsername,
	usernameChanged,
	user,
	name,
	previousName,
	rawName,
	nameChanged,
}: {
	username: string;
	previousUsername: string;
	rawUsername?: string;
	usernameChanged: boolean;
	user: IUser;
	name: string;
	previousName: string | undefined;
	rawName?: string;
	nameChanged: boolean;
}): Promise<void> {
	if (usernameChanged && typeof rawUsername !== 'undefined') {
		const fileStore = FileUpload.getStore('Avatars');
		const previousFile = await fileStore.model.findOneByName(previousUsername);
		const file = await fileStore.model.findOneByName(username);
		if (file) {
			await fileStore.model.deleteFile(file._id);
		}
		if (previousFile) {
			await fileStore.model.updateFileNameById(previousFile._id, username);
		}

		await Messages.updateAllUsernamesByUserId(user._id, username);
		await Messages.updateUsernameOfEditByUserId(user._id, username);

		const cursor = Messages.findByMention(previousUsername);
		for await (const msg of cursor) {
			const updatedMsg = msg.msg.replace(new RegExp(`@${previousUsername}`, 'ig'), `@${username}`);
			await Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
		}

		const responses = await Promise.all([
			Rooms.replaceUsername(previousUsername, username),
			Rooms.replaceMutedUsername(previousUsername, username),
			Rooms.replaceUsernameOfUserByUserId(user._id, username),
			Subscriptions.setUserUsernameByUserId(user._id, username),
			LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(user._id, username),
		]);

		if (responses[3]?.modifiedCount) {
			void notifyOnSubscriptionChangedByUserId(user._id);
		}

		if (responses[0]?.modifiedCount || responses[1]?.modifiedCount || responses[2]?.modifiedCount) {
			void notifyOnRoomChangedByUsernamesOrUids([user._id], [previousUsername, username]);
		}
	}

	// update other references if either the name or username has changed
	if (usernameChanged || nameChanged) {
		// update name and fname of 1-on-1 direct messages
		const updateDirectNameResponse = await Subscriptions.updateDirectNameAndFnameByName(
			previousUsername,
			rawUsername && username,
			rawName && name,
		);

		if (updateDirectNameResponse?.modifiedCount) {
			void notifyOnSubscriptionChangedByNameAndRoomType({
				t: 'd',
				name: username,
			});
		}

		// update name and fname of group direct messages
		await updateGroupDMsName(user);

		// update name and username of users on video conferences
		await VideoConference.updateUserReferences(user._id, username || previousUsername, name || previousName);
	}
}
