import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server';
import { Users } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:getAnalyticsChartData'(options) {
		const userId = Meteor.userId();
		if (!userId || !(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
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
