/* eslint-disable new-cap */
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';
import moment from 'moment-timezone';
import type { Filter } from 'mongodb';

import { secondsToHHMMSS } from '../../../lib/utils/secondsToHHMMSS';

type OverviewDataValidActions = 'Conversations' | 'Productivity';

export class OverviewData {
	constructor(private readonly roomsModel: ILivechatRoomsModel) {}

	isActionAllowed(action: string | undefined): action is OverviewDataValidActions {
		if (!action) {
			return false;
		}
		return ['Conversations', 'Productivity'].includes(action);
	}

	callAction<T extends OverviewDataValidActions>(
		action: T,
		...args: [moment.Moment, moment.Moment, string?, string?, ((v: string) => string)?, Filter<IOmnichannelRoom>?]
	) {
		switch (action) {
			case 'Conversations':
				return this.Conversations(...args);
			case 'Productivity':
				return this.Productivity(...args);
			default:
				throw new Error('Invalid action');
		}
	}

	getKeyHavingMaxValue<T>(map: Map<T, number>, def: T): T {
		let maxValue = 0;
		let maxKey = def; // default

		map.forEach((value, key) => {
			if (value > maxValue) {
				maxValue = value;
				maxKey = key;
			}
		});

		return maxKey;
	}

	sumAllMapKeys<T>(map: Map<T, number>): number {
		let sum = 0;

		map.forEach((value) => {
			sum += value;
		});

		return sum;
	}

	getBusiestDay(map: Map<string, Map<string, number>>): string {
		let mostMessages = -1;
		let busiestDay = '-';

		map.forEach((value, key) => {
			const v = this.sumAllMapKeys(value);
			if (v > mostMessages) {
				mostMessages = v;
				busiestDay = key;
			}
		});

		return busiestDay;
	}

	getAllMapKeysSize<T>(map: Map<T, Map<T, number>>): number {
		let size = 0;

		[...map.keys()].forEach((key) => {
			size += map.get(key)?.size || 0;
		});

		return size;
	}

	async Conversations(
		from: moment.Moment,
		to: moment.Moment,
		departmentId?: string,
		timezone = 'UTC',
		t = (v: string): string => v,
		extraQuery: Filter<IOmnichannelRoom> = {},
	) {
		const analyticsMap = new Map();
		let openConversations = 0; // open conversations
		let totalMessages = 0; // total msgs
		let totalConversations = 0; // Total conversations
		const days = to.diff(from, 'days') + 1; // total days

		const date = {
			gte: moment.tz(from, timezone).startOf('day').utc(),
			lte: moment.tz(to, timezone).endOf('day').utc(),
		};

		// @ts-expect-error - Check extraquery usage on this func
		const cursor = this.roomsModel.getAnalyticsBetweenDate(date, { departmentId }, extraQuery);

		for await (const room of cursor) {
			totalConversations++;

			if (room.metrics && !room.metrics.chatDuration && !room.onHold) {
				openConversations++;
			}
			const creationDay = moment.tz(room.ts, timezone).format('DD-MM-YYYY'); // @string: 01-01-2021
			const creationHour = moment.tz(room.ts, timezone).format('H'); // @int : 0, 1, ... 23

			if (!analyticsMap.has(creationDay)) {
				analyticsMap.set(creationDay, new Map());
			}

			const dayMap = analyticsMap.get(creationDay);

			if (!dayMap.has(creationHour)) {
				dayMap.set(creationHour, 0);
			}

			dayMap.set(creationHour, dayMap.get(creationHour) ? dayMap.get(creationHour) + room.msgs : room.msgs);
			totalMessages += room.msgs;
		}

		// @ts-expect-error - Check extraquery usage on this func
		const onHoldConversations = await this.roomsModel.getOnHoldConversationsBetweenDate(from, to, departmentId, extraQuery);
		const busiestDayFromMap = this.getBusiestDay(analyticsMap); // returns busiest day based on the number of messages sent on that day
		const busiestHour = this.getKeyHavingMaxValue<number>(analyticsMap.get(busiestDayFromMap) || new Map(), -1); // returns key with max value
		const busiestTimeFrom = busiestHour >= 0 ? moment.tz(`${busiestHour}`, 'H', timezone).format('hA') : ''; // @string: 12AM, 1AM ...
		const busiestTimeTo = busiestHour >= 0 ? moment.tz(`${busiestHour}`, 'H', timezone).add(1, 'hour').format('hA') : ''; // @string: 1AM, 2AM ...
		const busiestDay = busiestDayFromMap !== '-' ? moment.tz(busiestDayFromMap, 'DD-MM-YYYY', timezone).format('dddd') : ''; // @string: Monday, Tuesday ...

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
				value: t(busiestDay) || '-',
			},
			{
				title: 'Conversations_per_day',
				value: (totalConversations / days).toFixed(2),
			},
			{
				title: 'Busiest_time',
				value: `${busiestTimeFrom}${busiestTimeTo ? ` - ${busiestTimeTo}` : ''}` || '-',
			},
		];
	}

	async Productivity(
		from: moment.Moment,
		to: moment.Moment,
		departmentId?: string,
		_timezone?: string,
		_t = (v: string): string => v,
		extraQuery?: Filter<IOmnichannelRoom>,
	) {
		let avgResponseTime = 0;
		let firstResponseTime = 0;
		let avgReactionTime = 0;
		let count = 0;

		const date = {
			gte: from.toDate(),
			lte: to.toDate(),
		};

		await this.roomsModel.getAnalyticsMetricsBetweenDate('l', date, { departmentId }, extraQuery).forEach(({ metrics }) => {
			if (metrics?.response && metrics.reaction) {
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
	}
}
