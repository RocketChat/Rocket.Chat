import moment from 'moment';

export const Analytics = {
	ChartData: {
		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Integer}
		 */
		Total_conversations(date) {
			return RocketChat.models.Rooms.getTotalConversationsBetweenDate('l', date);
		},

		Avg_chat_duration(date) {
			let total = 0;
			let count = 0;

			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.chatDuration) {
					total += metrics.chatDuration;
					count++;
				}
			});

			const avgCD = (count) ? total/count : 0;
			return Math.round(avgCD*100)/100;
		},

		Total_messages(date) {
			let total = 0;

			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({msgs}) => {
				if (msgs) {
					total += msgs;
				}
			});

			return total;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		First_response_time(date) {
			let frt = 0;
			let count = 0;
			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.response && metrics.response.ft) {
					frt += metrics.response.ft;
					count++;
				}
			});

			const avgFrt = (count) ? frt/count : 0;
			return Math.round(avgFrt*100)/100;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		Avg_response_time(date) {
			let art = 0;
			let count = 0;
			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.response && metrics.response.avg) {
					art += metrics.response.avg;
					count++;
				}
			});

			const avgArt = (count) ? art/count : 0;

			return Math.round(avgArt*100)/100;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		Avg_reaction_time(date) {
			let arnt = 0;
			let count = 0;
			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.reaction && metrics.reaction.ft) {
					arnt += metrics.reaction.ft;
					count++;
				}
			});

			const avgArnt = (count) ? arnt/count : 0;

			return Math.round(avgArnt*100)/100;
		}
	},

	OverviewData: {
		/**
		 *
		 * @param {Map} map
		 *
		 * @return {String}
		 */
		getKeyHavingMaxValue(map, def) {
			let maxValue = 0;
			let maxKey = def;	// default

			map.forEach((value, key) => {
				if (value > maxValue) {
					maxValue = value;
					maxKey = key;
				}
			});

			return maxKey;
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array[Object]}
		 */
		Conversations(from, to) {
			let totalConversations = 0; // Total conversations
			let openConversations = 0; // open conversations
			let totalMessages = 0; // total msgs
			const totalMessagesOnWeekday = new Map();	// total messages on weekdays i.e Monday, Tuesday...
			const totalMessagesInHour = new Map();		// total messages in hour 0, 1, ... 23 of weekday
			const days = to.diff(from, 'days') + 1;		// total days

			for (let m = moment(from); m.diff(to, 'days') <= 0; m.add(1, 'days')) {
				const date = {
					gte: m,
					lt: moment(m).add(1, 'days')
				};

				const result = RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date);
				totalConversations += result.count();

				result.forEach(({
					metrics,
					msgs
				}) => {
					if (metrics && !metrics.chatDuration) {
						openConversations++;
					}
					totalMessages += msgs;

					const weekday = m.format('dddd'); // @string: Monday, Tuesday ...
					totalMessagesOnWeekday.set(weekday, (totalMessagesOnWeekday.has(weekday)) ? (totalMessagesOnWeekday.get(weekday) + msgs) : msgs);
				});
			}

			const busiestDay = this.getKeyHavingMaxValue(totalMessagesOnWeekday, '-'); //returns key with max value

			// iterate through all busiestDay in given date-range and find busiest hour
			for (let m = moment(from).day(busiestDay); m <= to; m.add(7, 'days')) {
				if (m < from) { continue; }

				for (let h = moment(m); h.diff(m, 'days') <= 0; h.add(1, 'hours')) {
					const date = {
						gte: h,
						lt: moment(h).add(1, 'hours')
					};

					RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({
						msgs
					}) => {
						const dayHour = h.format('H');		// @int : 0, 1, ... 23
						totalMessagesInHour.set(dayHour, (totalMessagesInHour.has(dayHour)) ? (totalMessagesInHour.get(dayHour) + msgs) : msgs);
					});
				}
			}

			const busiestHour = this.getKeyHavingMaxValue(totalMessagesInHour, -1);

			const data = [{
				'title': 'Total_conversations',
				'value': totalConversations
			}, {
				'title': 'Open_conversations',
				'value': openConversations
			}, {
				'title': 'Total_messages',
				'value': totalMessages
			}, {
				'title': 'Busiest_day',
				'value': busiestDay
			}, {
				'title': 'Conversations_per_day',
				'value': (totalConversations/days).toFixed(2)
			}, {
				'title': 'Busiest_time',
				'value': (busiestHour > 0) ? `${ moment(busiestHour, ['H']).format('hA') }-${ moment((parseInt(busiestHour)+1)%24, ['H']).format('hA') }` : '-'
			}];

			return data;
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array[Object]}
		 */
		Productivity(from, to) {
			let avgResponseTime = 0;
			let firstResponseTime = 0;
			let avgReactionTime = 0;
			let count = 0;

			const date = {
				gte: from,
				lt: to.add(1, 'days')
			};

			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({
				metrics
			}) => {
				if (metrics && metrics.response && metrics.reaction) {
					avgResponseTime += metrics.response.avg;
					firstResponseTime += metrics.response.ft;
					avgReactionTime += metrics.reaction.ft;
					count++;
				}
			});

			if (count) {
				avgResponseTime /= count;
				firstResponseTime /= count;
				avgReactionTime /= count;
			}

			const data = [{
				'title': 'Avg_response_time',
				'value': avgResponseTime.toFixed(2)
			}, {
				'title': 'First_response_time',
				'value': firstResponseTime.toFixed(2)
			}, {
				'title': 'Avg_reaction_time',
				'value': avgReactionTime.toFixed(2)
			}];

			return data;
		}
	},

	AgentOverviewData: {
		/**
		 * do operation equivalent to map[key] += value
		 *
		 */
		updateMap(map, key, value) {
			map.set(key, map.has(key) ? (map.get(key) + value) : value);
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array(Object), Array(Object)}
		 */
		Conversations(from, to) {
			let total = 0;
			const agentConversations = new Map(); // stores total conversations for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days')
			};

			const data = {
				head: [{
					name: 'Agent'
				}, {
					name: '%_of_conversations'
				}],
				data: []
			};

			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({
				servedBy
			}) => {
				if (servedBy) {
					this.updateMap(agentConversations, servedBy.username, 1);
					total++;
				}
			});

			agentConversations.forEach((value, key) => {	// calculate percentage
				const percentage = (value/total*100).toFixed(2);

				data.data.push({
					name: key,
					value: percentage
				});
			});

			data.data.sort(function(a, b) {		//reverse sort array
				if (a.value > b.value) {
					return -1;
				}
				if (a.value < b.value) {
					return 1;
				}
				return 0;
			});

			data.data.forEach((value) => {
				value.value = `${ value.value }%`;
			});

			return data;
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array(Object), Array(Object)}
		 */
		Productivity(from, to) {
			const agentAvgRespTime = new Map(); // stores avg response time for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days')
			};

			const data = {
				head: [{
					name: 'Agent'
				}, {
					name: 'First_response_time'
				}],
				data: []
			};

			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({
				metrics,
				servedBy
			}) => {
				if (servedBy && metrics && metrics.response && metrics.response.ft) {
					if (agentAvgRespTime.has(servedBy.username)) {
						agentAvgRespTime.set(servedBy.username, {
							frt: agentAvgRespTime.get(servedBy.username).frt + metrics.response.ft,
							total: agentAvgRespTime.get(servedBy.username).total + 1
						});
					} else {
						agentAvgRespTime.set(servedBy.username, {
							frt: metrics.response.ft,
							total: 1
						});
					}
				}
			});

			agentAvgRespTime.forEach((obj, key) => {	// calculate avg
				const avg = obj.frt/obj.total;

				data.data.push({
					name: key,
					value: avg.toFixed(2)
				});
			});

			data.data.sort(function(a, b) {		// sort array
				if (a.value > b.value) {
					return 1;
				}
				if (a.value < b.value) {
					return -1;
				}
				return 0;
			});

			return data;
		}
	}
};
