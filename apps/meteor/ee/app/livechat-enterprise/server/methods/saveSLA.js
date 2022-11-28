import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:saveSLA'(_id, slaData) {
		methodDeprecationLogger.warn(
			'livechat:saveSLA is deprecated and will be removed in future versions of Rocket.Chat. Use POST/PUT /api/v1/livechat/sla REST API instead.',
		);
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-sla')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveSLA',
			});
		}

		return Promise.await(LivechatEnterprise.saveSLA(_id, slaData));
	},
});
