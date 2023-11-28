import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';
import type { Filter } from 'mongodb';

/* eslint-disable new-cap */
type ChartDataValidActions =
	| 'Total_conversations'
	| 'Avg_chat_duration'
	| 'Total_messages'
	| 'Avg_first_response_time'
	| 'Avg_reaction_time';

type DateParam = {
	gte: Date;
	lt: Date;
};

export class ChartData {
	constructor(private readonly roomsModel: ILivechatRoomsModel) {}

	isActionAllowed(action: string | undefined): action is ChartDataValidActions {
		if (!action) {
			return false;
		}
		return ['Total_conversations', 'Avg_chat_duration', 'Total_messages', 'Avg_first_response_time', 'Avg_reaction_time'].includes(action);
	}

	callAction<T extends ChartDataValidActions>(action: T, ...args: [DateParam, string?, Filter<IOmnichannelRoom>?]) {
		switch (action) {
			case 'Total_conversations':
				return this.Total_conversations(...args);
			case 'Avg_chat_duration':
				return this.Avg_chat_duration(...args);
			case 'Total_messages':
				return this.Total_messages(...args);
			case 'Avg_first_response_time':
				return this.Avg_first_response_time(...args);
			case 'Avg_reaction_time':
				return this.Avg_reaction_time(...args);
			default:
				throw new Error('Invalid action');
		}
	}

	async Total_conversations(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		// @ts-expect-error - Check extraquery usage on this func
		return this.roomsModel.getTotalConversationsBetweenDate('l', date, { departmentId }, extraQuery);
	}

	async Avg_chat_duration(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let total = 0;
		let count = 0;

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
			if (metrics?.chatDuration) {
				total += metrics.chatDuration;
				count++;
			}
		});

		const avgCD = count ? total / count : 0;
		return Math.round(avgCD * 100) / 100;
	}

	async Total_messages(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let total = 0;

		// we don't want to count visitor messages
		const extraFilter = { $lte: ['$token', null] };
		await this.roomsModel
			.getAnalyticsMetricsBetweenDateWithMessages('l', date, { departmentId }, extraFilter, extraQuery)
			.forEach(({ msgs }) => {
				if (msgs) {
					total += msgs;
				}
			});

		return total;
	}

	async Avg_first_response_time(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let frt = 0;
		let count = 0;
		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
			if (metrics?.response?.ft) {
				frt += metrics.response.ft;
				count++;
			}
		});

		const avgFrt = count ? frt / count : 0;
		return Math.round(avgFrt * 100) / 100;
	}

	async Best_first_response_time(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let maxFrt = 0;

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
			if (metrics?.response?.ft) {
				maxFrt = maxFrt ? Math.min(maxFrt, metrics.response.ft) : metrics.response.ft;
			}
		});

		if (!maxFrt) {
			maxFrt = 0;
		}

		return Math.round(maxFrt * 100) / 100;
	}

	async Avg_response_time(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let art = 0;
		let count = 0;
		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
			if (metrics?.response?.avg) {
				art += metrics.response.avg;
				count++;
			}
		});

		const avgArt = count ? art / count : 0;

		return Math.round(avgArt * 100) / 100;
	}

	async Avg_reaction_time(date: DateParam, departmentId?: string, extraQuery: Filter<IOmnichannelRoom> = {}) {
		let arnt = 0;
		let count = 0;
		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
			if (metrics?.reaction?.ft) {
				arnt += metrics.reaction.ft;
				count++;
			}
		});

		const avgArnt = count ? arnt / count : 0;

		return Math.round(avgArnt * 100) / 100;
	}
}
