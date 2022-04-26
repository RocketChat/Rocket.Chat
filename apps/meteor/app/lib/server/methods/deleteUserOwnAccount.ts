import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { SHA256 } from 'meteor/sha';
import s from 'underscore.string';

import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';
import { deleteUser } from '../functions';
import { AppEvents, Apps } from '../../../apps/server/orchestrator';

Meteor.methods({
	async deleteUserOwnAccount(password, confirmRelinquish) {
		check(password, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteUserOwnAccount',
			});
		}

		if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUserOwnAccount',
			});
		}

		const uid = Meteor.userId();
		const user = Users.findOneById(uid);

		if (!user || !uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteUserOwnAccount',
			});
		}

		if (user.services && user.services.password && s.trim(user.services.password.bcrypt)) {
			const result = Accounts._checkPassword(user, {
				digest: password.toLowerCase(),
				algorithm: 'sha-256',
			});
			if (result.error) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'deleteUserOwnAccount',
				});
			}
		} else if (SHA256(user.username) !== s.trim(password)) {
			throw new Meteor.Error('error-invalid-username', 'Invalid username', {
				method: 'deleteUserOwnAccount',
			});
		}

		await deleteUser(uid, confirmRelinquish);

		// App IPostUserDeleted event hook
		Promise.await(Apps.triggerEvent(AppEvents.IPostUserDeleted, { user }));

		return true;
	},
});
