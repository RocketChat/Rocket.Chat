import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';
import { Users } from '../../../models';

Meteor.methods({
	'livechat:getAgentOverviewData'(options) {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAgentOverviewData',
			});
		}

		if (!(options.chartOptions && options.chartOptions.name)) {
			Livechat.logger.warn('Incorrect analytics options');
			return;
		}

		const user = Users.findOneById(userId, { fields: { _id: 1, utcOffset: 1 } });
		return Livechat.Analytics.getAgentOverviewData({ ...options, utcOffset: user?.utcOffset || 0 });
	},
});
