import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { retrieveRegistrationStatus } from './functions/retrieveRegistrationStatus';
import { connectWorkspace } from './functions/connectWorkspace';
import { getOAuthAuthorizationUrl } from './functions/getOAuthAuthorizationUrl';
import { finishOAuthAuthorization } from './functions/finishOAuthAuthorization';
import { startRegisterWorkspace } from './functions/startRegisterWorkspace';
import { disconnectWorkspace } from './functions/disconnectWorkspace';
import { syncWorkspace } from './functions/syncWorkspace';
import { checkUserHasCloudLogin } from './functions/checkUserHasCloudLogin';
import { userLogout } from './functions/userLogout';
import { hasPermission } from '../../authorization';
import { buildWorkspaceRegistrationData } from './functions/buildRegistrationData';

Meteor.methods({
	'cloud:checkRegisterStatus'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:checkRegisterStatus',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:checkRegisterStatus',
			});
		}

		return retrieveRegistrationStatus();
	},
	async 'cloud:getWorkspaceRegisterData'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:getWorkspaceRegisterData',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:getWorkspaceRegisterData',
			});
		}

		return Buffer.from(JSON.stringify(await buildWorkspaceRegistrationData())).toString('base64');
	},
	async 'cloud:registerWorkspace'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:startRegister',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:startRegister',
			});
		}

		return startRegisterWorkspace();
	},
	async 'cloud:syncWorkspace'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:syncWorkspace',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:syncWorkspace',
			});
		}

		return syncWorkspace();
	},
	'cloud:connectWorkspace'(token) {
		check(token, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		if (!token) {
			throw new Meteor.Error('error-invalid-payload', 'Token is required.', {
				method: 'cloud:connectServer',
			});
		}

		return connectWorkspace(token);
	},
	'cloud:disconnectWorkspace'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return disconnectWorkspace();
	},
	// Currently unused but will link local account to Rocket.Chat Cloud account.
	'cloud:getOAuthAuthorizationUrl'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return getOAuthAuthorizationUrl();
	},
	'cloud:finishOAuthAuthorization'(code, state) {
		check(code, String);
		check(state, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:finishOAuthAuthorization',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return finishOAuthAuthorization(code, state);
	},
	'cloud:checkUserLoggedIn'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return checkUserHasCloudLogin(Meteor.userId());
	},
	'cloud:logout'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return userLogout(Meteor.userId());
	},
});
