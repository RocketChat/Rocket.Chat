import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:getAnalyticsChartData'(options) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsChartData',
			});
		}

		if (!(options.chartOptions && options.chartOptions.name)) {
			console.log('Incorrect chart options');
			return;
		}

		return Livechat.Analytics.getAnalyticsChartData(options);
	},
});
