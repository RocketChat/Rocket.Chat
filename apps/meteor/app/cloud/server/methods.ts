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
import { hasPermission } from '../../authorization/server';
import { buildWorkspaceRegistrationData } from './functions/buildRegistrationData';

Meteor.methods({
	'cloud:checkRegisterStatus'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:checkRegisterStatus',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:checkRegisterStatus',
			});
		}

		return retrieveRegistrationStatus();
	},
	async 'cloud:getWorkspaceRegisterData'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:getWorkspaceRegisterData',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:getWorkspaceRegisterData',
			});
		}

		return Buffer.from(JSON.stringify(await buildWorkspaceRegistrationData(undefined))).toString('base64');
	},
	async 'cloud:registerWorkspace'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:startRegister',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:startRegister',
			});
		}

		return startRegisterWorkspace();
	},
	async 'cloud:syncWorkspace'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:syncWorkspace',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:syncWorkspace',
			});
		}

		return syncWorkspace();
	},
	'cloud:connectWorkspace'(token) {
		check(token, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
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
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return disconnectWorkspace();
	},
	// Currently unused but will link local account to Rocket.Chat Cloud account.
	'cloud:getOAuthAuthorizationUrl'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return getOAuthAuthorizationUrl();
	},
	'cloud:finishOAuthAuthorization'(code, state) {
		check(code, String);
		check(state, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:finishOAuthAuthorization',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return finishOAuthAuthorization(userId, code, state);
	},
	'cloud:checkUserLoggedIn'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return checkUserHasCloudLogin(userId);
	},
	'cloud:logout'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'cloud:connectServer',
			});
		}

		if (!hasPermission(userId, 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'cloud:connectServer',
			});
		}

		return userLogout(userId);
	},
});
