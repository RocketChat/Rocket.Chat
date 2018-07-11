import moment from 'moment';

Meteor.methods({
	'livechat:getAnalyticsChartData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsChartData'
			});
		}

		if (!(options.chartOptions && options.chartOptions.name)) {
			return;
		}

		// Check if function exists, prevent server error in case property altered
		if (!RocketChat.Livechat.Analytics.ChartData[options.chartOptions.name]) {
			console.log(`Method RocketChat.Livechat.Analytics.ChartData.${ options.chartOptions.name } does NOT exist`);
			return;
		}

		const from = moment(new Date(options.daterange.from));
		const to = moment(new Date(options.daterange.to));

		if (!(moment(from).isValid() && moment(to).isValid())) {
			console.log('Invalid dates');
			return;
		}


		const data = {
			chartLabel: options.chartOptions.name,
			dataLabels: [],
			dataPoints: []
		};

		if (from.diff(to) === 0) {	// data for single day
			for (let m = moment(from); m.diff(to, 'days') <= 0; m.add(1, 'hours')) {
				const hour = m.format('H');
				data.dataLabels.push(`${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour)+1)%24, ['H']).format('hA') }`);

				const date = {
					gte: m,
					lt: moment(m).add(1, 'hours')
				};

				data.dataPoints.push(RocketChat.Livechat.Analytics.ChartData[options.chartOptions.name](date));
			}
		} else {
			for (let m = moment(from); m.diff(to, 'days') <= 0; m.add(1, 'days')) {
				data.dataLabels.push(m.format('M/D/YY'));

				const date = {
					gte: m,
					lt: moment(m).add(1, 'days')
				};

				data.dataPoints.push(RocketChat.Livechat.Analytics.ChartData[options.chartOptions.name](date));
			}
		}

		return data;
	}
});
