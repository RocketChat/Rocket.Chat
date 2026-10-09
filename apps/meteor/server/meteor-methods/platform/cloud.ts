import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { checkUserHasCloudLogin } from '../../lib/cloud/checkUserHasCloudLogin';
import { finishOAuthAuthorization } from '../../lib/cloud/finishOAuthAuthorization';
import { getOAuthAuthorizationUrl } from '../../lib/cloud/getOAuthAuthorizationUrl';
import { startRegisterWorkspace } from '../../lib/cloud/startRegisterWorkspace';
import { userLogout } from '../../lib/cloud/userLogout';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'cloud:registerWorkspace': () => boolean;
		'cloud:getOAuthAuthorizationUrl': () => string;
		'cloud:finishOAuthAuthorization': (code: string, state: string) => boolean;
		'cloud:checkUserLoggedIn': () => boolean;
		'cloud:logout': () => Promise<boolean | string>;
	}
}

Meteor.methods<ServerMethods>({
	async 'cloud:registerWorkspace'() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:registerWorkspace',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:registerWorkspace',
			});
		}

		return startRegisterWorkspace();
	},
	// Currently unused but will link local account to Rocket.Chat Cloud account.
	async 'cloud:getOAuthAuthorizationUrl'() {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:getOAuthAuthorizationUrl',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:getOAuthAuthorizationUrl',
			});
		}

		return getOAuthAuthorizationUrl();
	},
	async 'cloud:finishOAuthAuthorization'(code, state) {
		check(code, String);
		check(state, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:finishOAuthAuthorization',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:finishOAuthAuthorization',
			});
		}

		return finishOAuthAuthorization(code, state);
	},
	async 'cloud:checkUserLoggedIn'() {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:checkUserLoggedIn',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:checkUserLoggedIn',
			});
		}

		return checkUserHasCloudLogin(uid);
	},
	async 'cloud:logout'() {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:logout',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:logout',
			});
		}

		return userLogout(uid);
	},
});
