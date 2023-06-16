import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { retrieveRegistrationStatus } from './functions/retrieveRegistrationStatus';
import { connectWorkspace } from './functions/connectWorkspace';
import { reconnectWorkspace } from './functions/reconnectWorkspace';
import { getOAuthAuthorizationUrl } from './functions/getOAuthAuthorizationUrl';
import { finishOAuthAuthorization } from './functions/finishOAuthAuthorization';
import { startRegisterWorkspace } from './functions/startRegisterWorkspace';
import { disconnectWorkspace } from './functions/disconnectWorkspace';
import { syncWorkspace } from './functions/syncWorkspace';
import { checkUserHasCloudLogin } from './functions/checkUserHasCloudLogin';
import { userLogout } from './functions/userLogout';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { buildWorkspaceRegistrationData } from './functions/buildRegistrationData';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'cloud:checkRegisterStatus': () => {
			connectToCloud: boolean;
			workspaceRegistered: boolean;
			workspaceId: string;
			uniqueId: string;
			token: string;
			email: string;
		};
		'cloud:getWorkspaceRegisterData': () => string;
		'cloud:registerWorkspace': () => boolean;
		'cloud:syncWorkspace': () => boolean;
		'cloud:connectWorkspace': (token: string) => boolean | Error;
		'cloud:reconnectWorkspace': () => boolean;
		'cloud:disconnectWorkspace': () => boolean;
		'cloud:getOAuthAuthorizationUrl': () => string;
		'cloud:finishOAuthAuthorization': (code: string, state: string) => boolean;
		'cloud:checkUserLoggedIn': () => boolean;
		'cloud:logout': () => Promise<boolean | string>;
	}
}

Meteor.methods<ServerMethods>({
	async 'cloud:checkRegisterStatus'() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:checkRegisterStatus',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:checkRegisterStatus',
			});
		}

		return retrieveRegistrationStatus();
	},
	async 'cloud:getWorkspaceRegisterData'() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:getWorkspaceRegisterData',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:getWorkspaceRegisterData',
			});
		}

		return Buffer.from(JSON.stringify(await buildWorkspaceRegistrationData(undefined))).toString('base64');
	},
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
	async 'cloud:syncWorkspace'() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:syncWorkspace',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:syncWorkspace',
			});
		}

		return syncWorkspace();
	},
	async 'cloud:connectWorkspace'(token) {
		check(token, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectWorkspace',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectWorkspace',
			});
		}

		if (!token) {
			throw new Meteor.Error('error-invalid-payload', 'Token is required.', {
				method: 'cloud:connectWorkspace',
			});
		}

		return connectWorkspace(token);
	},
	async 'cloud:disconnectWorkspace'() {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return disconnectWorkspace();
	},
	async 'cloud:reconnectWorkspace'() {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:reconnectWorkspace',
			});
		}

		if (!(await hasPermissionAsync(uid, 'manage-cloud'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:reconnectWorkspace',
			});
		}

		return reconnectWorkspace();
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
