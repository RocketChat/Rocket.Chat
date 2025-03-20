import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult } from 'mongodb';

import { passwordPolicy } from '../../app/lib/server';
import { compareUserPassword } from '../lib/compareUserPassword';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setUserPassword(password: string): UpdateResult;
	}
}

Meteor.methods<ServerMethods>({
	async setUserPassword(password) {
		check(password, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserPassword',
			});
		}

		const user = await Users.findOneById(userId);

		if (user && user.requirePasswordChange !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserPassword',
			});
		}

		if (!user) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserPassword',
			});
		}
		if (await compareUserPassword(user, { plain: password })) {
			throw new Meteor.Error('error-password-same-as-current', 'Entered password same as current password', {
				method: 'setUserPassword',
			});
		}

		passwordPolicy.validate(password);

		await Accounts.setPasswordAsync(userId, password, {
			logout: false,
		});

		return Users.unsetRequirePasswordChange(userId);
	},
});
