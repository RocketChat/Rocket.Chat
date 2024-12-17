/* eslint-disable new-cap */
import type { ConversationData } from '@rocket.chat/core-services';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';
import type { Filter } from 'mongodb';

import { secondsToHHMMSS } from '../../../lib/utils/secondsToHHMMSS';

type AgentOverviewValidActions =
	| 'Total_conversations'
	| 'Avg_chat_duration'
	| 'Total_messages'
	| 'Avg_first_response_time'
	| 'Best_first_response_time'
	| 'Avg_response_time'
	| 'Avg_reaction_time';

export class AgentOverviewData {
	constructor(private readonly roomsModel: ILivechatRoomsModel) {}

	updateMap<K>(map: Map<K, number>, key: K, value: number) {
		const currentKeyValue = map.get(key);
		map.set(key, currentKeyValue ? currentKeyValue + value : value);
	}

	sortByValue(data: { value: string }[], inv = false) {
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
	}

	isActionAllowed(action: string | undefined): action is AgentOverviewValidActions {
		if (!action) {
			return false;
		}
		return [
			'Total_conversations',
			'Avg_chat_duration',
			'Total_messages',
			'Avg_first_response_time',
			'Best_first_response_time',
			'Avg_response_time',
			'Avg_reaction_time',
		].includes(action);
	}

	callAction<T extends AgentOverviewValidActions>(action: T, ...args: [moment.Moment, moment.Moment, string?, Filter<IOmnichannelRoom>?]) {
		switch (action) {
			case 'Total_conversations':
				return this.Total_conversations(...args);
			case 'Avg_chat_duration':
				return this.Avg_chat_duration(...args);
			case 'Total_messages':
				return this.Total_messages(...args);
			case 'Avg_first_response_time':
				return this.Avg_first_response_time(...args);
			case 'Best_first_response_time':
				return this.Best_first_response_time(...args);
			case 'Avg_response_time':
				return this.Avg_response_time(...args);
			case 'Avg_reaction_time':
				return this.Avg_reaction_time(...args);
			default:
				throw new Error('Invalid action');
		}
	}

	async Total_conversations(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let total = 0;
		const agentConversations = new Map(); // stores total conversations for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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

		await this.roomsModel
			.getAnalyticsMetricsBetweenDateWithMessages(
				'l',
				date,
				{
					departmentId,
				},
				{},
				extraQuery,
			)
			.forEach((room) => {
				if (room.servedBy) {
					this.updateMap(agentConversations, room.servedBy.username, 1);
					total++;
				}
			});

		agentConversations.forEach((value, key) => {
			// calculate percentage
			const percentage = ((value / total) * 100).toFixed(2);

			data.data.push({
				name: key,
				value: `${percentage}%`,
			});
		});

		this.sortByValue(data.data, true); // reverse sort array

		return data;
	}

	async Avg_chat_duration(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		const agentChatDurations = new Map(); // stores total conversations for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
				value: secondsToHHMMSS(avg),
			});
		});

		this.sortByValue(data.data, true); // reverse sort array

		return data;
	}

	async Total_messages(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		const agentMessages = new Map(); // stores total conversations for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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
		await this.roomsModel
			.getAnalyticsMetricsBetweenDateWithMessages('l', date, { departmentId }, extraFilter, extraQuery)
			.forEach(({ servedBy, msgs }) => {
				if (servedBy) {
					this.updateMap(agentMessages, servedBy.username, msgs);
				}
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
	}

	async Avg_first_response_time(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		const agentAvgRespTime = new Map(); // stores avg response time for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, responseBy }) => {
			if (responseBy && metrics && metrics.response && metrics.response.ft) {
				if (agentAvgRespTime.has(responseBy.username)) {
					agentAvgRespTime.set(responseBy.username, {
						frt: agentAvgRespTime.get(responseBy.username).frt + metrics.response.ft,
						total: agentAvgRespTime.get(responseBy.username).total + 1,
					});
				} else {
					agentAvgRespTime.set(responseBy.username, {
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
				value: secondsToHHMMSS(avg.toFixed(2)),
			});
		});

		this.sortByValue(data.data, false); // sort array

		return data;
	}

	async Best_first_response_time(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		const agentFirstRespTime = new Map(); // stores best response time for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, responseBy }) => {
			if (responseBy && metrics && metrics.response && metrics.response.ft) {
				if (agentFirstRespTime.has(responseBy.username)) {
					agentFirstRespTime.set(responseBy.username, Math.min(agentFirstRespTime.get(responseBy.username), metrics.response.ft));
				} else {
					agentFirstRespTime.set(responseBy.username, metrics.response.ft);
				}
			}
		});

		agentFirstRespTime.forEach((value, key) => {
			// calculate avg
			data.data.push({
				name: key,
				value: secondsToHHMMSS(value.toFixed(2)),
			});
		});

		this.sortByValue(data.data, false); // sort array

		return data;
	}

	async Avg_response_time(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		const agentAvgRespTime = new Map(); // stores avg response time for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
				value: secondsToHHMMSS(avg.toFixed(2)),
			});
		});

		this.sortByValue(data.data, false); // sort array

		return data;
	}

	async Avg_reaction_time(from: moment.Moment, to: moment.Moment, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		const agentAvgReactionTime = new Map(); // stores avg reaction time for each agent
		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		const data: ConversationData = {
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

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics, servedBy }) => {
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
				value: secondsToHHMMSS(avg.toFixed(2)),
			});
		});

		this.sortByValue(data.data, false); // sort array

		return data;
	}
}
