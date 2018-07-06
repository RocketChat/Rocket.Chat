Meteor.methods({
	'livechat:getAnalyticsOverviewData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:getAnalyticsOverviewData' });
		}

		// get overview here..
		console.log('daterange');
		console.log(options.daterange);
		console.log('overview options');
		console.log(options.analyticsOverviewOptions);

		const data1 = [[{
			title: 'Total_conversations',
			value: parseInt(Math.random()*3333, 10)
		}, {
			title: 'Open_conversations',
			value: parseInt(Math.random()*33, 10)
		}], [{
			title: 'Total_messages',
			value: parseInt(Math.random()*57792, 10)
		}, {
			title: 'Busiest_day',
			value: 'Tuesday'
		}], [{
			title: 'Conversations_per_day',
			value: Math.round(Math.random()*330*100)/100
		}, {
			title: 'Busiest_time',
			value: '11am-12am'
		}]];

		const data2 = [[{
			title: 'Avg_response_time',
			value: Math.round(Math.random()*30*100)/100
		}], [{
			title: 'First_response_time',
			value: Math.round(Math.random()*10*100)/100
		}], [{
			title: 'Avg_reaction_time',
			value: Math.round(Math.random()*20*100)/100
		}]];

		if (options.analyticsOverviewOptions[0][0].title === 'Total_conversations') {
			return data1;
		}

		return data2;
	}
});
