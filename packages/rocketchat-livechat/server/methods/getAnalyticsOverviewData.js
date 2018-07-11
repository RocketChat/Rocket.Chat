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

		// const data = options.analyticsOptions.analyticsOverviewOptions;		// getting data format

		// switch (options.analyticsOptions.name) {
		// 	case 'Conversations':
		// 		let totalConversations = 0; // Total conversations
		// 		let openConversations = 0; // open conversations
		// 		let totalMessages = 0; // total msgs
		// 		const totalMessagesOnWeekday = new Map();	// total messages on weekdays i.e Monday, Tuesday...
		// 		const totalMessagesInHour = new Map();		// total messages in hour 0, 1, ... 23 of weekday
		// 		const days = to.diff(from, 'days') + 1;		// total days

		// 		for (let m = moment(from); m.diff(to, 'days') <= 0; m.add(1, 'days')) {
		// 			const date = {
		// 				gte: m,
		// 				lt: moment(m).add(1, 'days')
		// 			};

		// 			const result = RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date);
		// 			totalConversations += result.count();

		// 			result.forEach(({
		// 				metrics,
		// 				msgs
		// 			}) => {
		// 				if (metrics && !metrics.chatDuration) {
		// 					openConversations++;
		// 				}
		// 				totalMessages += msgs;

		// 				const weekday = m.format('dddd'); // @string: Monday, Tuesday ...
		// 				totalMessagesOnWeekday[weekday] = (totalMessagesOnWeekday[weekday]) ? (totalMessagesOnWeekday[weekday] + msgs) : msgs;
		// 			});
		// 		}

		// 		const busiestDay = Object.keys(totalMessagesOnWeekday).reduce((a, b) => totalMessagesOnWeekday[a] > totalMessagesOnWeekday[b] ? a : b); //returns key with max value

		// 		// iterate through all busiestDay in given date-range and find busiest hour
		// 		for (let m = moment(from).day(busiestDay); m <= to; m.add(7, 'days')) {
		// 			if (m < from) { continue; }

		// 			for (let h = moment(m); h.diff(m, 'days') <= 0; h.add(1, 'hours')) {
		// 				const date = {
		// 					gte: h,
		// 					lt: moment(h).add(1, 'hours')
		// 				};

		// 				RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({
		// 					msgs
		// 				}) => {
		// 					const dayHour = h.format('H');		// @int : 0, 1, ... 23
		// 					totalMessagesInHour[dayHour] = (totalMessagesInHour[dayHour]) ? (totalMessagesInHour[dayHour] + msgs) : msgs;
		// 				});
		// 			}
		// 		}

		// 		const busiestHour = Object.keys(totalMessagesInHour).reduce((a, b) => totalMessagesInHour[a] > totalMessagesInHour[b] ? a : b);

		// 		data[0][0]['value'] = totalConversations;
		// 		data[0][1]['value'] = openConversations;

		// 		data[1][0]['value'] = totalMessages;
		// 		data[1][1]['value'] = busiestDay;

		// 		data[2][0]['value'] = Math.round(totalConversations*100/days)/100;
		// 		data[2][1]['value'] = `${ moment(busiestHour, ['H']).format('hA') }-${ moment((parseInt(busiestHour)+1)%24, ['H']).format('hA') }`;
		// 		break;
		// 	case 'Productivity':
		// 		let avgResponseTime = 0;
		// 		let firstResponseTime = 0;
		// 		let avgReactionTime = 0;
		// 		let count = 0;

		// 		const date = {
		// 			gte: from,
		// 			lt: to.add(1, 'days')
		// 		};

		// 		RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({
		// 			metrics
		// 		}) => {
		// 			if (metrics && metrics.response && metrics.reaction) {
		// 				avgResponseTime += metrics.response.avg;
		// 				firstResponseTime += metrics.response.ft;
		// 				avgReactionTime += metrics.reaction.ft;
		// 				count++;
		// 			}
		// 		});

		// 		if (count) {
		// 			avgResponseTime /= count;
		// 			firstResponseTime /= count;
		// 			avgReactionTime /= count;
		// 		}

		// 		data[0][0]['value'] = Math.round(avgResponseTime * 100) / 100;

		// 		data[1][0]['value'] = Math.round(firstResponseTime * 100) / 100;

		// 		data[2][0]['value'] = Math.round(avgReactionTime * 100) / 100;
		// 		break;
		// 	default:
		// 		console.log('Invalid options');
		// 		break;
		// }

		// return data;
	}
});
