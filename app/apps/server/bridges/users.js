import { Random } from 'meteor/random';

import { setUserAvatar, checkUsernameAvailability, deleteUser } from '../../../lib/server/functions';
import { Users } from '../../../models';


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

		const user = Users.findOne({ appId });

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

	async getActiveUserCount() {
		return Users.getActiveLocalUserCount();
	}
}
