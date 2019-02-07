import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'livechat:getAnalyticsChartData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsChartData',
			});
		}

		if (!(options.chartOptions && options.chartOptions.name)) {
			console.log('Incorrect chart options');
			return;
		}

		return RocketChat.Livechat.Analytics.getAnalyticsChartData(options);
	},
});
