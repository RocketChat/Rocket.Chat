import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:getAnalyticsChartData'(options) {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsChartData',
			});
		}

		if (!(options.chartOptions && options.chartOptions.name)) {
			Livechat.logger.warn('Incorrect chart options');
			return;
		}

		const user = Users.findOneById(userId, { fields: { _id: 1, utcOffset: 1 } });

		return Livechat.Analytics.getAnalyticsChartData({ ...options, utcOffset: user?.utcOffset });
	},
});
