Meteor.methods({
	'livechat:getAnalyticsOverviewData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:getAnalyticsOverviewData' });
		}

		// get overview here..
		console.log(options);

		const data1 = [[{
			title: 'Total Conversations',
			value: parseInt(Math.random()*3333, 10)
		}, {
			title: 'Open Conversations',
			value: parseInt(Math.random()*33, 10)
		}], [{
			title: 'Total Messages',
			value: parseInt(Math.random()*57792, 10)
		}, {
			title: 'Busiest Day',
			value: 'Tuesday'
		}], [{
			title: 'Conversations per day',
			value: Math.round(Math.random()*330*100)/100
		}, {
			title: 'Busiest Time',
			value: '11am-12am'
		}]];

		const data2 = [[{
			title: 'Response Time',
			value: Math.round(Math.random()*30*100)/100
		}], [{
			title: '1st Response Time',
			value: Math.round(Math.random()*10*100)/100
		}], [{
			title: 'Reaction Time',
			value: Math.round(Math.random()*20*100)/100
		}]];

		if (options.analyticsOptions[0][0].title === 'Total Conversations') {
			return data1;
		}

		return data2;
	}
});
