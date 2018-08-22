import moment from 'moment';

Meteor.methods({
	'livechat:getAnalyticsOverviewData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsOverviewData',
			});
		}

		if (!(options.analyticsOptions && options.analyticsOptions.name)) {
			console.log('Incorrect analytics options');
			return;
		}

		const from = moment(options.daterange.from, 'MMM D YYYY');
		const to = moment(options.daterange.to, 'MMM D YYYY');

		if (!(moment(from).isValid() && moment(to).isValid())) {
			console.log('livechat:getAnalyticsOverviewData => Invalid dates');
			return;
		}

		if (!RocketChat.Livechat.Analytics.OverviewData[options.analyticsOptions.name]) {
			console.log(`Method RocketChat.Livechat.Analytics.OverviewData.${ options.analyticsOptions.name } does NOT exist`);
			return;
		}

		return RocketChat.Livechat.Analytics.OverviewData[options.analyticsOptions.name](from, to);
	},
});
