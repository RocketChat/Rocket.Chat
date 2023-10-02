import type { IRole } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

const rolesToChangeTo: Map<IRole['_id'], [IRole['_id']]> = new Map([['anonymous', ['user']]]);

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		afterVerifyEmail(): void;
	}
}

Meteor.methods<ServerMethods>({
	async afterVerifyEmail() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'afterVerifyEmail',
			});
		}

		const user = await Users.findOneById(userId);
		if (user?.emails && Array.isArray(user.emails)) {
			const verifiedEmail = user.emails.find((email) => email.verified);

			const rolesThatNeedChanges = user.roles.filter((role) => rolesToChangeTo.has(role));

			if (verifiedEmail) {
				await Promise.all(
					rolesThatNeedChanges.map(async (role) => {
						const rolesToAdd = rolesToChangeTo.get(role);
						if (rolesToAdd) {
							await Roles.addUserRoles(userId, rolesToAdd);
						}
						await Roles.removeUserRoles(user._id, [role]);
					}),
				);
			}
		}
	},
});
