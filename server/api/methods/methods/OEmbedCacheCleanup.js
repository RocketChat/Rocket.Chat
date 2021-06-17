import { Meteor } from 'meteor/meteor';

import { OEmbedCache } from '../../../models';
import { settings } from '../../../settings';
import { hasRole } from '../../../../app/authorization';

Meteor.methods({
	OEmbedCacheCleanup() {
		if (Meteor.userId() && !hasRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'OEmbedCacheCleanup',
			});
		}

		const date = new Date();
		const expirationDays = settings.get('API_EmbedCacheExpirationDays');
		date.setDate(date.getDate() - expirationDays);
		OEmbedCache.removeAfterDate(date);
		return {
			message: 'cache_cleared',
		};
	},
});
