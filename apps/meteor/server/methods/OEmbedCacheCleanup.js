import { Meteor } from 'meteor/meteor';

import { OEmbedCache } from '../../app/models/server/raw';
import { settings } from '../../app/settings/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';

Meteor.methods({
	async OEmbedCacheCleanup() {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'clear-oembed-cache'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'OEmbedCacheCleanup',
			});
		}

		const date = new Date();
		const expirationDays = settings.get('API_EmbedCacheExpirationDays');
		date.setDate(date.getDate() - expirationDays);
		await OEmbedCache.removeAfterDate(date);
		return {
			message: 'cache_cleared',
		};
	},
});
