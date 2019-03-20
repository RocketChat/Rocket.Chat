import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from '../../authorization';
import { Settings } from '../../models';

import { retrieveRegistrationStatus } from './functions/retrieveRegistrationStatus';
import { connectWorkspace } from './functions/connectWorkspace';
import { getOAuthAuthorizationUrl } from './functions/getOAuthAuthorizationUrl';
import { finishOAuthAuthorization } from './functions/finishOAuthAuthorization';
import { startRegisterWorkspace } from './functions/startRegisterWorkspace';
import { disconnectWorkspace } from './functions/disconnectWorkspace';
import { settings } from '../../settings/server';

Meteor.methods({
	'cloud:checkRegisterStatus'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:checkRegisterStatus' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:checkRegisterStatus' });
		}

		return retrieveRegistrationStatus();
	},
	'cloud:registerWorkspace'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:startRegister' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:startRegister' });
		}

		return startRegisterWorkspace();
	},
	'cloud:updateEmail'(email) {
		check(email, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:updateEmail' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:updateEmail' });
		}

		const existingEmail = settings.get('Organization_Email');

		if (email !== existingEmail) {
			Settings.updateValueById('Organization_Email', email);

			return startRegisterWorkspace();
		}

		return;
	},
	'cloud:connectWorkspace'(token) {
		check(token, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:connectServer' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:connectServer' });
		}

		return connectWorkspace(token);
	},
	'cloud:disconnectWorkspace'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:connectServer' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:connectServer' });
		}

		return disconnectWorkspace();
	},
	'cloud:getOAuthAuthorizationUrl'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:connectServer' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:connectServer' });
		}

		return getOAuthAuthorizationUrl();
	},
	'cloud:finishOAuthAuthorization'(code, state) {
		check(code, String);
		check(state, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:finishOAuthAuthorization' });
		}

		if (!hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:connectServer' });
		}

		return finishOAuthAuthorization(code, state);
	},
});
