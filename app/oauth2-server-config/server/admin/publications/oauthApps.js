import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization';
import { OAuthApps } from '../../../../models';

Meteor.publish('oauthApps', function() {
	console.warn('The publication "oauthApps" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.ready();
	}
	if (!hasPermission(this.userId, 'manage-oauth-apps')) {
		this.error(Meteor.Error('error-not-allowed', 'Not allowed', { publish: 'oauthApps' }));
	}
	return OAuthApps.find();
});
