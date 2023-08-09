import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { passwordPolicy } from '../../app/lib/server';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getPasswordPolicy(params: { token: string }): {
			enabled: boolean;
			policy: [name: string, options?: Record<string, unknown>][];
		};
	}
}

Meteor.methods<ServerMethods>({
	async getPasswordPolicy(params) {
		methodDeprecationLogger.method('getPasswordPolicy', '7.0.0');

		check(params, { token: String });

		const user = await Users.findOne({ 'services.password.reset.token': params.token });
		if (!user && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getPasswordPolicy',
			});
		}
		return passwordPolicy.getPasswordPolicy();
	},
});
