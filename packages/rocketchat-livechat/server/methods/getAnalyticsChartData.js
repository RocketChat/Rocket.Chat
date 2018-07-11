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

			data.dataPoints.push(RocketChat.Livechat.Analytics.ChartData[options.chartOptions.name](date));
		}

		return data;
	}
});
