import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';

import { LivechatRooms } from '../../../models';
import { LivechatRooms as LivechatRoomsRaw } from '../../../models/server/raw';
import { secondsToHHMMSS } from '../../../utils/server';
import { getTimezone } from '../../../utils/server/lib/getTimezone';
import { Logger } from '../../../logger';

const HOURS_IN_DAY = 24;
const logger = new Logger('OmnichannelAnalytics');

export const Analytics = {
	getAgentOverviewData(options) {
		const { departmentId, utcOffset, daterange: { from: fDate, to: tDate } = {}, chartOptions: { name } = {} } = options;
		const timezone = getTimezone({ utcOffset });
		const from = moment.tz(fDate, 'YYYY-MM-DD', timezone).startOf('day').utc();
		const to = moment.tz(tDate, 'YYYY-MM-DD', timezone).endOf('day').utc();

		logger.debug(`getAgentOverviewData[${name}] -> Using timezone ${timezone} with date range ${from} - ${to}`);

		if (!(moment(from).isValid() && moment(to).isValid())) {
			logger.error('livechat:getAgentOverviewData => Invalid dates');
			return;
		}

		if (!this.AgentOverviewData[name]) {
			logger.error(`Method RocketChat.Livechat.Analytics.AgentOverviewData.${name} does NOT exist`);
			return;
		}

		return this.AgentOverviewData[name](from, to, departmentId);
	},

	getAnalyticsChartData(options) {
		const {
			utcOffset,
			departmentId,
			daterange: { from: fDate, to: tDate } = {},
			chartOptions: { name: chartLabel },
			chartOptions: { name } = {},
		} = options;

		// Check if function exists, prevent server error in case property altered
		if (!this.ChartData[name]) {
			logger.error(`Method RocketChat.Livechat.Analytics.ChartData.${name} does NOT exist`);
			return;
		}

		const timezone = getTimezone({ utcOffset });
		const from = moment.tz(fDate, 'YYYY-MM-DD', timezone).startOf('day').utc();
		const to = moment.tz(tDate, 'YYYY-MM-DD', timezone).endOf('day').utc();
		const isSameDay = from.diff(to, 'days') === 0;

		logger.debug(`getAnalyticsChartData[${name}] -> Using timezone ${timezone} with date range ${from} - ${to}`);

		if (!(moment(from).isValid() && moment(to).isValid())) {
			logger.error('livechat:getAnalyticsChartData => Invalid dates');
			return;
		}

		const data = {
			chartLabel,
			dataLabels: [],
			dataPoints: [],
		};

		if (isSameDay) {
			// data for single day
			for (let m = moment(from), currentHour = 0; currentHour < HOURS_IN_DAY; currentHour++) {
				const hour = m.add(currentHour ? 1 : 0, 'hour').format('H');
				const label = {
					from: moment.utc().set({ hour }).tz(timezone).format('hA'),
					to: moment.utc().set({ hour }).add(1, 'hour').tz(timezone).format('hA'),
				};
				data.dataLabels.push(`${label.from}-${label.to}`);

				const date = {
					gte: m,
					lt: moment(m).add(1, 'hours'),
				};

				data.dataPoints.push(this.ChartData[name](date, departmentId));
			}
		} else {
			for (let m = moment(from); m.diff(to, 'days') <= 0; m.add(1, 'days')) {
				data.dataLabels.push(m.format('M/D'));

				const date = {
					gte: m,
					lt: moment(m).add(1, 'days'),
				};

				data.dataPoints.push(this.ChartData[name](date, departmentId));
			}
		}

		return data;
	},

	getAnalyticsOverviewData(options) {
		const { departmentId, utcOffset = 0, language, daterange: { from: fDate, to: tDate } = {}, analyticsOptions: { name } = {} } = options;
		const timezone = getTimezone({ utcOffset });
		const from = moment.tz(fDate, 'YYYY-MM-DD', timezone).startOf('day').utc();
		const to = moment.tz(tDate, 'YYYY-MM-DD', timezone).endOf('day').utc();

		logger.debug(`getAnalyticsOverviewData[${name}] -> Using timezone ${timezone} with date range ${from} - ${to}`);

		if (!(moment(from).isValid() && moment(to).isValid())) {
			logger.error('livechat:getAnalyticsOverviewData => Invalid dates');
			return;
		}

		if (!this.OverviewData[name]) {
			logger.error(`Method RocketChat.Livechat.Analytics.OverviewData.${name} does NOT exist`);
			return;
		}

		const t = (s) => TAPi18n.__(s, { lng: language });

		return this.OverviewData[name](from, to, departmentId, timezone, t);
	},

	ChartData: {
		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Integer}
		 */
		Total_conversations(date, departmentId) {
			return LivechatRooms.getTotalConversationsBetweenDate('l', date, { departmentId });
		},

		Avg_chat_duration(date, departmentId) {
			let total = 0;
			let count = 0;

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics }) => {
				if (metrics && metrics.chatDuration) {
					total += metrics.chatDuration;
					count++;
				}
			});

			const avgCD = count ? total / count : 0;
			return Math.round(avgCD * 100) / 100;
		},

		Total_messages(date, departmentId) {
			let total = 0;

			// we don't want to count visitor messages
			const extraFilter = { $lte: ['$token', null] };
			const allConversations = Promise.await(
				LivechatRooms.getAnalyticsMetricsBetweenDateWithMessages('l', date, { departmentId }, extraFilter).toArray(),
			);
			allConversations.map(({ msgs }) => {
				if (msgs) {
					total += msgs;
				}
				return null;
			});

			return total;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		Avg_first_response_time(date, departmentId) {
			let frt = 0;
			let count = 0;
			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics }) => {
				if (metrics && metrics.response && metrics.response.ft) {
					frt += metrics.response.ft;
					count++;
				}
			});

			const avgFrt = count ? frt / count : 0;
			return Math.round(avgFrt * 100) / 100;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		Best_first_response_time(date, departmentId) {
			let maxFrt;

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics }) => {
				if (metrics && metrics.response && metrics.response.ft) {
					maxFrt = maxFrt ? Math.min(maxFrt, metrics.response.ft) : metrics.response.ft;
				}
			});

			if (!maxFrt) {
				maxFrt = 0;
			}

			return Math.round(maxFrt * 100) / 100;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		Avg_response_time(date, departmentId) {
			let art = 0;
			let count = 0;
			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics }) => {
				if (metrics && metrics.response && metrics.response.avg) {
					art += metrics.response.avg;
					count++;
				}
			});

			const avgArt = count ? art / count : 0;

			return Math.round(avgArt * 100) / 100;
		},

		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Double}
		 */
		Avg_reaction_time(date, departmentId) {
			let arnt = 0;
			let count = 0;
			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics }) => {
				if (metrics && metrics.reaction && metrics.reaction.ft) {
					arnt += metrics.reaction.ft;
					count++;
				}
			});

			const avgArnt = count ? arnt / count : 0;

			return Math.round(avgArnt * 100) / 100;
		},
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
			let maxKey = def; // default

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
		Conversations(from, to, departmentId, timezone, t = (v) => v) {
			// TODO: most calls to db here can be done in one single call instead of one per day/hour
			let totalConversations = 0; // Total conversations
			let openConversations = 0; // open conversations
			let totalMessages = 0; // total msgs
			const totalMessagesOnWeekday = new Map(); // total messages on weekdays i.e Monday, Tuesday...
			const totalMessagesInHour = new Map(); // total messages in hour 0, 1, ... 23 of weekday
			const days = to.diff(from, 'days') + 1; // total days

			const summarize =
				(m) =>
				({ metrics, msgs, onHold = false }) => {
					if (metrics && !metrics.chatDuration && !onHold) {
						openConversations++;
					}
					totalMessages += msgs;

					const weekday = m.format('dddd'); // @string: Monday, Tuesday ...
					totalMessagesOnWeekday.set(weekday, totalMessagesOnWeekday.has(weekday) ? totalMessagesOnWeekday.get(weekday) + msgs : msgs);
				};

			for (let m = moment.tz(from, timezone).startOf('day').utc(), daysProcessed = 0; daysProcessed < days; daysProcessed++) {
				const clonedDate = m.clone();
				const date = {
					gte: clonedDate,
					lt: m.add(1, 'days'),
				};
				const result = Promise.await(LivechatRooms.getAnalyticsBetweenDate(date, { departmentId }).toArray());
				totalConversations += result.length;

				result.forEach(summarize(clonedDate));
			}

			const busiestDay = this.getKeyHavingMaxValue(totalMessagesOnWeekday, '-'); // returns key with max value

			// TODO: this code assumes the busiest day is the same every week, which may not be true
			// This means that for periods larger than 1 week, the busiest hour won't be the "busiest hour"
			// on the period, but the busiest hour on the busiest day. (sorry for busiest excess)
			// iterate through all busiestDay in given date-range and find busiest hour
			for (let m = moment.tz(from, timezone).day(busiestDay).startOf('day').utc(); m <= to; m.add(7, 'days')) {
				if (m < from) {
					continue;
				}
				for (let h = moment(m), currentHour = 0; currentHour < 24; currentHour++) {
					const date = {
						gte: h.clone(),
						lt: h.add(1, 'hours'),
					};
					Promise.await(LivechatRooms.getAnalyticsBetweenDate(date, { departmentId }).toArray()).forEach(({ msgs }) => {
						const dayHour = h.format('H'); // @int : 0, 1, ... 23
						totalMessagesInHour.set(dayHour, totalMessagesInHour.has(dayHour) ? totalMessagesInHour.get(dayHour) + msgs : msgs);
					});
				}
			}

			const utcBusiestHour = this.getKeyHavingMaxValue(totalMessagesInHour, -1);
			const busiestHour = {
				to: utcBusiestHour >= 0 ? moment.utc().set({ hour: utcBusiestHour }).tz(timezone).format('hA') : '-',
				from: utcBusiestHour >= 0 ? moment.utc().set({ hour: utcBusiestHour }).subtract(1, 'hour').tz(timezone).format('hA') : '',
			};
			const onHoldConversations = Promise.await(LivechatRoomsRaw.getOnHoldConversationsBetweenDate(from, to, departmentId));

			return [
				{
					title: 'Total_conversations',
					value: totalConversations,
				},
				{
					title: 'Open_conversations',
					value: openConversations,
				},
				{
					title: 'On_Hold_conversations',
					value: onHoldConversations,
				},
				{
					title: 'Total_messages',
					value: totalMessages,
				},
				{
					title: 'Busiest_day',
					value: t(busiestDay),
				},
				{
					title: 'Conversations_per_day',
					value: (totalConversations / days).toFixed(2),
				},
				{
					title: 'Busiest_time',
					value: `${busiestHour.from}${busiestHour.to ? `- ${busiestHour.to}` : ''}`,
				},
			];
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array[Object]}
		 */
		Productivity(from, to, departmentId) {
			let avgResponseTime = 0;
			let firstResponseTime = 0;
			let avgReactionTime = 0;
			let count = 0;

			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics }) => {
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

			const data = [
				{
					title: 'Avg_response_time',
					value: secondsToHHMMSS(avgResponseTime.toFixed(2)),
				},
				{
					title: 'Avg_first_response_time',
					value: secondsToHHMMSS(firstResponseTime.toFixed(2)),
				},
				{
					title: 'Avg_reaction_time',
					value: secondsToHHMMSS(avgReactionTime.toFixed(2)),
				},
			];

			return data;
		},
	},

	AgentOverviewData: {
		/**
		 * do operation equivalent to map[key] += value
		 *
		 */
		updateMap(map, key, value) {
			map.set(key, map.has(key) ? map.get(key) + value : value);
		},

		/**
		 * Sort array of objects by value property of object
		 * @param  {Array(Object)} data
		 * @param  {Boolean} [inv=false] reverse sort
		 */
		sortByValue(data, inv = false) {
			data.sort(function (a, b) {
				// sort array
				if (parseFloat(a.value) > parseFloat(b.value)) {
					return inv ? -1 : 1; // if inv, reverse sort
				}
				if (parseFloat(a.value) < parseFloat(b.value)) {
					return inv ? 1 : -1;
				}
				return 0;
			});
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array(Object), Array(Object)}
		 */
		Total_conversations(from, to, departmentId) {
			let total = 0;
			const agentConversations = new Map(); // stores total conversations for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: '%_of_conversations',
					},
				],
				data: [],
			};

			const allConversations = Promise.await(
				LivechatRooms.getAnalyticsMetricsBetweenDateWithMessages('l', date, {
					departmentId,
				}).toArray(),
			);
			allConversations.map((room) => {
				if (room.servedBy) {
					this.updateMap(agentConversations, room.servedBy.username, 1);
					total++;
				}
				return null;
			});

			agentConversations.forEach((value, key) => {
				// calculate percentage
				const percentage = ((value / total) * 100).toFixed(2);

				data.data.push({
					name: key,
					value: percentage,
				});
			});

			this.sortByValue(data.data, true); // reverse sort array

			data.data.forEach((value) => {
				value.value = `${value.value}%`;
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
		Avg_chat_duration(from, to, departmentId) {
			const agentChatDurations = new Map(); // stores total conversations for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_chat_duration',
					},
				],
				data: [],
			};

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics, servedBy }) => {
				if (servedBy && metrics && metrics.chatDuration) {
					if (agentChatDurations.has(servedBy.username)) {
						agentChatDurations.set(servedBy.username, {
							chatDuration: agentChatDurations.get(servedBy.username).chatDuration + metrics.chatDuration,
							total: agentChatDurations.get(servedBy.username).total + 1,
						});
					} else {
						agentChatDurations.set(servedBy.username, {
							chatDuration: metrics.chatDuration,
							total: 1,
						});
					}
				}
			});

			agentChatDurations.forEach((obj, key) => {
				// calculate percentage
				const avg = (obj.chatDuration / obj.total).toFixed(2);

				data.data.push({
					name: key,
					value: avg,
				});
			});

			this.sortByValue(data.data, true); // reverse sort array

			data.data.forEach((obj) => {
				obj.value = secondsToHHMMSS(obj.value);
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
		Total_messages(from, to, departmentId) {
			const agentMessages = new Map(); // stores total conversations for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Total_messages',
					},
				],
				data: [],
			};

			// we don't want to count visitor messages
			const extraFilter = { $lte: ['$token', null] };
			const allConversations = Promise.await(
				LivechatRooms.getAnalyticsMetricsBetweenDateWithMessages('l', date, { departmentId }, extraFilter).toArray(),
			);
			allConversations.map(({ servedBy, msgs }) => {
				if (servedBy) {
					this.updateMap(agentMessages, servedBy.username, msgs);
				}
				return null;
			});

			agentMessages.forEach((value, key) => {
				// calculate percentage
				data.data.push({
					name: key,
					value,
				});
			});

			this.sortByValue(data.data, true); // reverse sort array

			return data;
		},

		/**
		 *
		 * @param {Date} from
		 * @param {Date} to
		 *
		 * @returns {Array(Object), Array(Object)}
		 */
		Avg_first_response_time(from, to, departmentId) {
			const agentAvgRespTime = new Map(); // stores avg response time for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_first_response_time',
					},
				],
				data: [],
			};

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics, servedBy }) => {
				if (servedBy && metrics && metrics.response && metrics.response.ft) {
					if (agentAvgRespTime.has(servedBy.username)) {
						agentAvgRespTime.set(servedBy.username, {
							frt: agentAvgRespTime.get(servedBy.username).frt + metrics.response.ft,
							total: agentAvgRespTime.get(servedBy.username).total + 1,
						});
					} else {
						agentAvgRespTime.set(servedBy.username, {
							frt: metrics.response.ft,
							total: 1,
						});
					}
				}
			});

			agentAvgRespTime.forEach((obj, key) => {
				// calculate avg
				const avg = obj.frt / obj.total;

				data.data.push({
					name: key,
					value: avg.toFixed(2),
				});
			});

			this.sortByValue(data.data, false); // sort array

			data.data.forEach((obj) => {
				obj.value = secondsToHHMMSS(obj.value);
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
		Best_first_response_time(from, to, departmentId) {
			const agentFirstRespTime = new Map(); // stores avg response time for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Best_first_response_time',
					},
				],
				data: [],
			};

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics, servedBy }) => {
				if (servedBy && metrics && metrics.response && metrics.response.ft) {
					if (agentFirstRespTime.has(servedBy.username)) {
						agentFirstRespTime.set(servedBy.username, Math.min(agentFirstRespTime.get(servedBy.username), metrics.response.ft));
					} else {
						agentFirstRespTime.set(servedBy.username, metrics.response.ft);
					}
				}
			});

			agentFirstRespTime.forEach((value, key) => {
				// calculate avg
				data.data.push({
					name: key,
					value: value.toFixed(2),
				});
			});

			this.sortByValue(data.data, false); // sort array

			data.data.forEach((obj) => {
				obj.value = secondsToHHMMSS(obj.value);
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
		Avg_response_time(from, to, departmentId) {
			const agentAvgRespTime = new Map(); // stores avg response time for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
				data: [],
			};

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics, servedBy }) => {
				if (servedBy && metrics && metrics.response && metrics.response.avg) {
					if (agentAvgRespTime.has(servedBy.username)) {
						agentAvgRespTime.set(servedBy.username, {
							avg: agentAvgRespTime.get(servedBy.username).avg + metrics.response.avg,
							total: agentAvgRespTime.get(servedBy.username).total + 1,
						});
					} else {
						agentAvgRespTime.set(servedBy.username, {
							avg: metrics.response.avg,
							total: 1,
						});
					}
				}
			});

			agentAvgRespTime.forEach((obj, key) => {
				// calculate avg
				const avg = obj.avg / obj.total;

				data.data.push({
					name: key,
					value: avg.toFixed(2),
				});
			});

			this.sortByValue(data.data, false); // sort array

			data.data.forEach((obj) => {
				obj.value = secondsToHHMMSS(obj.value);
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
		Avg_reaction_time(from, to, departmentId) {
			const agentAvgReactionTime = new Map(); // stores avg reaction time for each agent
			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			const data = {
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
				data: [],
			};

			LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }).forEach(({ metrics, servedBy }) => {
				if (servedBy && metrics && metrics.reaction && metrics.reaction.ft) {
					if (agentAvgReactionTime.has(servedBy.username)) {
						agentAvgReactionTime.set(servedBy.username, {
							frt: agentAvgReactionTime.get(servedBy.username).frt + metrics.reaction.ft,
							total: agentAvgReactionTime.get(servedBy.username).total + 1,
						});
					} else {
						agentAvgReactionTime.set(servedBy.username, {
							frt: metrics.reaction.ft,
							total: 1,
						});
					}
				}
			});

			agentAvgReactionTime.forEach((obj, key) => {
				// calculate avg
				const avg = obj.frt / obj.total;

				data.data.push({
					name: key,
					value: avg.toFixed(2),
				});
			});

			this.sortByValue(data.data, false); // sort array

			data.data.forEach((obj) => {
				obj.value = secondsToHHMMSS(obj.value);
			});

			return data;
		},
	},
};
