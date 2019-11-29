import { Meteor } from 'meteor/meteor';

import { saveUser } from '../../../lib/server/functions/saveUser';
import { Users } from '../../../models/server';
import { Roles } from '../../../models';


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

	async create(user, appId) {
		this.orch.debugLog(`The App ${ appId } is requesting to create a new user`);

		user.password = 'pass';
		user.requirePasswordChange = true;


		if (typeof user.joinDefaultChannels === 'undefined') {
			user.joinDefaultChannels = true;
		}

		Roles.findUsersInRole('admin').forEach((adminUser) => {
			try {
				const newUserId = saveUser(adminUser._id, user);

				if (typeof user.active !== 'undefined') {
					Meteor.runAsUser(adminUser._id, () => {
						Meteor.call('setUserActiveStatus', newUserId, user.active);
					});
				}
				return newUserId;
			} catch (e) {
				console.error(e);
			}
		});
	}

	async getActiveUserCount() {
		return Users.getActiveLocalUserCount();
	}
}
