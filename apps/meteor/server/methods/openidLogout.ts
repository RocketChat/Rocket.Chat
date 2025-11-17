import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users } from '@rocket.chat/models';

import { logger } from '../lib/openid/logger';
import { Services } from '../lib/openid/OpenIDConnect';

Meteor.methods({
	async 'openid.performSingleLogout'(serviceName: string) {
		check(serviceName, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'openid.performSingleLogout' });
		}

		const service = Services[serviceName];
		if (!service) {
			throw new Meteor.Error('error-service-not-found', 'OpenID Connect service not found', {
				method: 'openid.performSingleLogout',
			});
		}

		if (!service.enableSLO) {
			logger.warn(`Single Logout not enabled for service ${serviceName}`);
			return null;
		}

		try {
			const logoutUrl = await service.performSingleLogout(userId);
			return logoutUrl;
		} catch (error: any) {
			logger.error(`Failed to perform Single Logout: ${error.message}`);
			throw new Meteor.Error('error-slo-failed', 'Failed to perform Single Logout', {
				method: 'openid.performSingleLogout',
			});
		}
	},
});
