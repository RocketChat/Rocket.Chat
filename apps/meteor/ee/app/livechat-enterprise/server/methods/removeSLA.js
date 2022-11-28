import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:removeSLA'(id) {
		methodDeprecationLogger.warn(
			'livechat:saveSLA is deprecated and will be removed in future versions of Rocket.Chat. Use DELETE /api/v1/livechat/sla/:slaId REST API instead.',
		);
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-sla')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeSLA',
			});
		}

		await LivechatEnterprise.removeSLA(id);
	},
});
