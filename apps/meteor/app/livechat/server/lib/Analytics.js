import { Logger } from '@rocket.chat/logger';
import { LivechatRooms } from '@rocket.chat/models';
import moment from 'moment-timezone';

import { callbacks } from '../../../../lib/callbacks';
import { secondsToHHMMSS } from '../../../../lib/utils/secondsToHHMMSS';
import { i18n } from '../../../../server/lib/i18n';
import { getTimezone } from '../../../utils/server/lib/getTimezone';

const HOURS_IN_DAY = 24;
const logger = new Logger('OmnichannelAnalytics');

async function* dayIterator(from, to) {
	const m = moment(from).startOf('day');
	while (m.diff(to, 'days') <= 0) {
		yield moment(m);
		m.add(1, 'days');
	}
}

async function* weekIterator(from, to, customDay, timezone) {
	const m = moment.tz(from, timezone).day(customDay);
	while (m.diff(to, 'weeks') <= 0) {
		yield moment(m);
		m.add(1, 'weeks');
	}
}

async function* hourIterator(day) {
	const m = moment(day).startOf('day');
	let passedHours = 0;
	while (passedHours < HOURS_IN_DAY) {
		yield moment(m);
		m.add(1, 'hours');
		passedHours++;
	}
}

export const Analytics = {
	async getAgentOverviewData(options) {
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

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		return this.AgentOverviewData[name](from, to, departmentId, extraQuery);
	},

	async getAnalyticsChartData(options) {
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

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		if (isSameDay) {
			// data for single day
			const m = moment(from);
			for await (const currentHour of Array.from({ length: HOURS_IN_DAY }, (_, i) => i)) {
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

				data.dataPoints.push(await this.ChartData[name](date, departmentId, extraQuery));
			}
		} else {
			for await (const m of dayIterator(from, to)) {
				data.dataLabels.push(m.format('M/D'));

				const date = {
					gte: m,
					lt: moment(m).add(1, 'days'),
				};

				data.dataPoints.push(await this.ChartData[name](date, departmentId, extraQuery));
			}
		}

		return data;
	},

	async getAnalyticsOverviewData(options) {
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

		const t = (s) => i18n.t(s, { lng: language });

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		return this.OverviewData[name](from, to, departmentId, timezone, t, extraQuery);
	},

	ChartData: {
		/**
		 *
		 * @param {Object} date {gte: {Date}, lt: {Date}}
		 *
		 * @returns {Integer}
		 */
		Total_conversations(date, departmentId, extraQuery) {
			return LivechatRooms.getTotalConversationsBetweenDate('l', date, { departmentId }, extraQuery);
		},

		async Avg_chat_duration(date, departmentId, extraQuery) {
			let total = 0;
			let count = 0;

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
				if (metrics && metrics.chatDuration) {
					total += metrics.chatDuration;
					count++;
				}
			});

			const avgCD = count ? total / count : 0;
			return Math.round(avgCD * 100) / 100;
		},

		async Total_messages(date, departmentId, extraQuery) {
			let total = 0;

			// we don't want to count visitor messages
			const extraFilter = { $lte: ['$token', null] };
			const allConversations = await LivechatRooms.getAnalyticsMetricsBetweenDateWithMessages(
				'l',
				date,
				{ departmentId },
				extraFilter,
				extraQuery,
			).toArray();
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
		async Avg_first_response_time(date, departmentId, extraQuery) {
			let frt = 0;
			let count = 0;
			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
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
		async Best_first_response_time(date, departmentId, extraQuery) {
			let maxFrt;

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
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
		async Avg_response_time(date, departmentId, extraQuery) {
			let art = 0;
			let count = 0;
			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
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
		async Avg_reaction_time(date, departmentId, extraQuery) {
			let arnt = 0;
			let count = 0;
			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
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
		async Conversations(from, to, departmentId, timezone, t = (v) => v, extraQuery) {
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

			const m = moment.tz(from, timezone).startOf('day').utc();
			// eslint-disable-next-line no-unused-vars
			for await (const _ of Array(days).fill(0)) {
				const clonedDate = m.clone();
				const date = {
					gte: clonedDate,
					lt: m.add(1, 'days'),
				};
				// eslint-disable-next-line no-await-in-loop
				const result = await LivechatRooms.getAnalyticsBetweenDate(date, { departmentId }, extraQuery).toArray();
				totalConversations += result.length;

				result.forEach(summarize(clonedDate));
			}

			const busiestDay = this.getKeyHavingMaxValue(totalMessagesOnWeekday, '-'); // returns key with max value

			// TODO: this code assumes the busiest day is the same every week, which may not be true
			// This means that for periods larger than 1 week, the busiest hour won't be the "busiest hour"
			// on the period, but the busiest hour on the busiest day. (sorry for busiest excess)
			// iterate through all busiestDay in given date-range and find busiest hour
			for await (const m of weekIterator(from, to, timezone)) {
				if (m < from) {
					continue;
				}

				for await (const h of hourIterator(m)) {
					const date = {
						gte: h.clone(),
						lt: h.add(1, 'hours'),
					};
					(await LivechatRooms.getAnalyticsBetweenDate(date, { departmentId }, extraQuery).toArray()).forEach(({ msgs }) => {
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
			const onHoldConversations = await LivechatRooms.getOnHoldConversationsBetweenDate(from, to, departmentId, extraQuery);

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
		async Productivity(from, to, departmentId, extraQuery) {
			let avgResponseTime = 0;
			let firstResponseTime = 0;
			let avgReactionTime = 0;
			let count = 0;

			const date = {
				gte: from,
				lt: to.add(1, 'days'),
			};

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
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
			data.sort((a, b) => {
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
		async Total_conversations(from, to, departmentId, extraQuery) {
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

			const allConversations = await LivechatRooms.getAnalyticsMetricsBetweenDateWithMessages(
				'l',
				date,
				{
					departmentId,
				},
				{},
				extraQuery,
			).toArray();
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
		async Avg_chat_duration(from, to, departmentId, extraQuery) {
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

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
		async Total_messages(from, to, departmentId, extraQuery) {
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
			const allConversations = await LivechatRooms.getAnalyticsMetricsBetweenDateWithMessages(
				'l',
				date,
				{ departmentId },
				extraFilter,
				extraQuery,
			).toArray();
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
		async Avg_first_response_time(from, to, departmentId, extraQuery) {
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

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
		async Best_first_response_time(from, to, departmentId, extraQuery) {
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

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
		async Avg_response_time(from, to, departmentId, extraQuery) {
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

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
		async Avg_reaction_time(from, to, departmentId, extraQuery) {
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

			await LivechatRooms.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
