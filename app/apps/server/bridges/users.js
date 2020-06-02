import { Random } from 'meteor/random';

import { setUserAvatar, checkUsernameAvailability, deleteUser, _setStatusTextPromise } from '../../../lib/server/functions';
import { Users } from '../../../models/server';
import { Users as UsersRaw } from '../../../models/server/raw';

export class AppUserBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async getById(userId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the userId: "${ userId }"`);

		return this.orch.getConverters().get('users').convertById(userId);
	}

	async getByUsername(username, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the username: "${ username }"`);

		return this.orch.getConverters().get('users').convertByUsername(username);
	}

	async getAppUser(appId) {
		this.orch.debugLog(`The App ${ appId } is getting its assigned user`);

		const user = Users.findOneByAppId(appId);

		return this.orch.getConverters().get('users').convertToApp(user);
	}

	async create(userDescriptor, appId, { avatarUrl }) {
		this.orch.debugLog(`The App ${ appId } is requesting to create a new user.`);
		const user = this.orch.getConverters().get('users').convertToRocketChat(userDescriptor);

		if (!user._id) {
			user._id = Random.id();
		}

		if (!user.createdAt) {
			user.createdAt = new Date();
		}

		switch (user.type) {
			case 'app':
				if (!checkUsernameAvailability(user.username)) {
					throw new Error(`The username "${ user.username }" is already being used. Rename or remove the user using it to install this App`);
				}

				Users.insert(user);

				if (avatarUrl) {
					setUserAvatar(user, avatarUrl, '', 'local');
				}

				break;

			default:
				throw new Error('Creating normal users is currently not supported');
		}

		return user._id;
	}

	async remove(user, appId) {
		this.orch.debugLog(`The App's user is being removed: ${ appId }`);

		// It's actually not a problem if there is no App user to delete - just means we don't need to do anything more.
		if (!user) {
			return true;
		}

		try {
			deleteUser(user.id);
		} catch (err) {
			throw new Error(`Errors occurred while deleting an app user: ${ err }`);
		}

		return true;
	}

	async update(user, fields, appId) {
		this.orch.debugLog(`The App ${ appId } is updating a user`);

		if (!user) {
			throw new Error('User not provided');
		}

		if (typeof fields.statusText === 'string') {
			await _setStatusTextPromise(user.id, fields.statusText);
			delete fields.statusText;
		}

		if (!Object.keys(fields).length) {
			return true;
		}

		await UsersRaw.update({ _id: user.id }, { $set: fields });

		return true;
	}

	async getActiveUserCount() {
		return Users.getActiveLocalUserCount();
	}
}
