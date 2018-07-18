import moment from 'moment';

Meteor.methods({
	'livechat:getAgentOverviewData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAgentOverviewData'
			});
		}

		if (!(options.analyticsOptions && options.analyticsOptions.name)) {
			console.log('Incorrect analytics options');
			return;
		}

		const from = moment(new Date(options.daterange.from));
		const to = moment(new Date(options.daterange.to));

		if (!(moment(from).isValid() && moment(to).isValid())) {
			console.log('Invalid dates');
			return;
		}

		if (!RocketChat.Livechat.Analytics.AgentOverviewData[options.analyticsOptions.name]) {
			console.log(`Method RocketChat.Livechat.Analytics.AgentOverviewData.${ options.analyticsOptions.name } does NOT exist`);
			return;
		}

		return RocketChat.Livechat.Analytics.AgentOverviewData[options.analyticsOptions.name](from, to);
	}
});
