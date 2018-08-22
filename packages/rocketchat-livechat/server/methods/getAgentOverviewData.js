import moment from 'moment';

Meteor.methods({
	'livechat:getAgentOverviewData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAgentOverviewData',
			});
		}

		if (!(options.chartOptions && options.chartOptions.name)) {
			console.log('Incorrect analytics options');
			return;
		}

		const from = moment(options.daterange.from, 'MMM D YYYY');
		const to = moment(options.daterange.to, 'MMM D YYYY');

		if (!(moment(from).isValid() && moment(to).isValid())) {
			console.log('livechat:getAgentOverviewData => Invalid dates');
			return;
		}

		if (!RocketChat.Livechat.Analytics.AgentOverviewData[options.chartOptions.name]) {
			console.log(`Method RocketChat.Livechat.Analytics.AgentOverviewData.${ options.chartOptions.name } does NOT exist`);
			return;
		}

		return RocketChat.Livechat.Analytics.AgentOverviewData[options.chartOptions.name](from, to);
	},
});
