Meteor.methods({
	'livechat:getAnalyticsChartData'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:getAnalyticsChartData' });
		}

		console.log(options);

		// get chart data here
		const data1 = {
			chartLabel : options.chartOptions[0].name,
			dataLabels : ['7/1/2018', '7/2/2018', '7/3/2018', '7/4/2018', '7/5/2018', '7/6/2018', '7/7/2018', '7/8/2018', '7/9/2018', '7/10/2018',
				'7/11/2018', '7/12/2018', '7/13/2018', '7/14/2018', '7/15/2018', '7/16/2018', '7/17/2018', '7/18/2018', '7/19/2018', '7/20/2018',
				'7/21/2018', '7/22/2018', '7/23/2018', '7/24/2018', '7/25/2018', '7/26/2018', '7/27/2018', '7/28/2018', '7/29/2018', '7/30/2018'],
			dataPoints : [Math.round(Math.random()*100)/100*20, Math.round(Math.random()*100)/100*19, Math.round(Math.random()*100)/100*3, Math.round(Math.random()*100)/100*5, Math.round(Math.random()*100)/100*2,
				Math.round(Math.random()*100)/100*3, Math.round(Math.random()*100)/100*8, 2, Math.round(Math.random()*100)/100*6, Math.round(Math.random()*100)/100*11, Math.round(Math.random()*100)/100*20,
				Math.round(Math.random()*100)/100*19, Math.round(Math.random()*100)/100*3, Math.round(Math.random()*100)/100*5, Math.round(Math.random()*100)/100*2, 3, Math.round(Math.random()*100)/100*8, 2,
				Math.round(Math.random()*100)/100*6, Math.round(Math.random()*100)/100*11, Math.round(Math.random()*100)/100*20, Math.round(Math.random()*100)/100*19, Math.round(Math.random()*100)/100*3,
				Math.round(Math.random()*100)/100*5, 2, 3, Math.round(Math.random()*100)/100*8, 2, Math.round(Math.random()*100)/100*6, Math.round(Math.random()*100)/100*11]
		};

		const data2 = {
			chartLabel : options.chartOptions[0].name,
			dataLabels : ['7/1/2018', '7/2/2018', '7/3/2018', '7/4/2018', '7/5/2018', '7/6/2018', '7/7/2018'],
			dataPoints : [Math.round(Math.random()*100)/100*20, Math.round(Math.random()*100)/100*19, Math.round(Math.random()*100)/100*3, Math.round(Math.random()*100)/100*5, Math.round(Math.random()*100)/100*7,
				Math.round(Math.random()*100)/100*3, Math.round(Math.random()*100)/100*8]
		};

		if (options.daterange.value === 'this-week' || options.daterange.value === 'prev-week') {
			return data2;
		}

		return data1;
	}
});
