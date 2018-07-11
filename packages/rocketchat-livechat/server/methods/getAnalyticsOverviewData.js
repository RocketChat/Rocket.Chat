import moment from 'moment';

Meteor.methods({
	'livechat:getAnalyticsOverviewData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsOverviewData'
			});
		}

		const from = moment(new Date(options.daterange.from));
		const to = moment(new Date(options.daterange.to));

		return RocketChat.Livechat.Analytics.OverviewData[options.analyticsOptions.name](from, to);
	}
});
