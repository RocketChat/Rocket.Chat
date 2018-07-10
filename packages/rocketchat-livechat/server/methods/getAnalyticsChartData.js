import moment from 'moment';

Meteor.methods({
	'livechat:getAnalyticsChartData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsChartData'
			});
		}

		const from = moment(new Date(options.daterange.from));
		const to = moment(new Date(options.daterange.to));

		const data = {
			chartLabel: options.chartOptions.name,
			dataLabels: [],
			dataPoints: []
		};

		for (let m = moment(from); m.diff(to, 'days') <= 0; m.add(1, 'days')) {
			data.dataLabels.push(m.format('M/D/YY'));

			const date = {
				gte: m,
				lt: moment(m).add(1, 'days')
			};

			switch (options.chartOptions.name) {
				case 'Total_conversations':
					//
					data.dataPoints.push(RocketChat.models.Rooms.getTotalConversationsBetweenDate('l', date));
					break;
				case 'First_response_time':
					//
					let frt = 0;
					let countFrt = 0;
					RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
						if (metrics && metrics.response && metrics.response.ft) {
							frt += metrics.response.ft;
							countFrt++;
						}
					});

					const avgFrt = (countFrt) ? frt/countFrt : 0;

					data.dataPoints.push(Math.round(avgFrt*100)/100);
					break;
				case 'Avg_response_time':
					//
					let art = 0;
					let countArt = 0;
					RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
						if (metrics && metrics.response && metrics.response.avg) {
							art += metrics.response.avg;
							countArt++;
						}
					});

					const avgArt = (countArt) ? art/countArt : 0;

					data.dataPoints.push(Math.round(avgArt*100)/100);
					break;
				case 'Avg_reaction_time':
					//
					let arnt = 0;
					let countArnt = 0;
					RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
						if (metrics && metrics.reaction && metrics.reaction.ft) {
							arnt += metrics.reaction.ft;
							countArnt++;
						}
					});

					const avgArnt = (countArnt) ? arnt/countArnt : 0;

					data.dataPoints.push(Math.round(avgArnt*100)/100);
					break;
				default:
					//
					data.dataLabels.pop();
					console.log('Option not recognised');
					break;
			}
		}

		return data;
	}
});
