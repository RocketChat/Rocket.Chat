/* eslint-disable new-cap */
import type { IOmnichannelRoom, AtLeast } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';
import moment from 'moment-timezone';
import type { Filter } from 'mongodb';

import { secondsToHHMMSS } from '../../../lib/utils/secondsToHHMMSS';
import { weekIterator, hourIterator } from './utils';

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

	async Conversations(
		from: moment.Moment,
		to: moment.Moment,
		departmentId?: string,
		timezone = 'UTC',
		t = (v: string): string => v,
		extraQuery: Filter<IOmnichannelRoom> = {},
	) {
		// TODO: most calls to db here can be done in one single call instead of one per day/hour
		let totalConversations = 0; // Total conversations
		let openConversations = 0; // open conversations
		let totalMessages = 0; // total msgs
		const totalMessagesOnWeekday = new Map(); // total messages on weekdays i.e Monday, Tuesday...
		const totalMessagesInHour = new Map(); // total messages in hour 0, 1, ... 23 of weekday
		const days = to.diff(from, 'days') + 1; // total days

		const summarize =
			(m: moment.Moment) =>
			({ metrics, msgs, onHold = false }: AtLeast<IOmnichannelRoom, 'metrics' | 'msgs' | 'onHold'>) => {
				if (metrics && !metrics.chatDuration && !onHold) {
					openConversations++;
				}
				totalMessages += msgs;

				const weekday = m.format('dddd'); // @string: Monday, Tuesday ...
				totalMessagesOnWeekday.set(weekday, totalMessagesOnWeekday.has(weekday) ? totalMessagesOnWeekday.get(weekday) + msgs : msgs);
			};

		const m = moment.tz(from, timezone).startOf('day').utc();
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for await (const _ of Array(days).fill(0)) {
			const clonedDate = m.clone();
			const date = {
				gte: clonedDate,
				lt: m.add(1, 'days'),
			};
			// eslint-disable-next-line no-await-in-loop
			// @ts-expect-error - Check extraquery usage on this func
			const result = await this.roomsModel.getAnalyticsBetweenDate(date, { departmentId }, extraQuery).toArray();
			totalConversations += result.length;

			result.forEach(summarize(clonedDate));
		}

		const busiestDay = this.getKeyHavingMaxValue<string>(totalMessagesOnWeekday, '-'); // returns key with max value

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
				// @ts-expect-error - Check extraquery usage on this func
				(await this.roomsModel.getAnalyticsBetweenDate(date, { departmentId }, extraQuery).toArray()).forEach(({ msgs }) => {
					const dayHour = h.format('H'); // @int : 0, 1, ... 23
					totalMessagesInHour.set(dayHour, totalMessagesInHour.has(dayHour) ? totalMessagesInHour.get(dayHour) + msgs : msgs);
				});
			}
		}

		const utcBusiestHour = this.getKeyHavingMaxValue<number>(totalMessagesInHour, -1);
		const busiestHour = {
			to: utcBusiestHour >= 0 ? moment.utc().set({ hour: utcBusiestHour }).tz(timezone).format('hA') : '',
			from: utcBusiestHour >= 0 ? moment.utc().set({ hour: utcBusiestHour }).subtract(1, 'hour').tz(timezone).format('hA') : '',
		};
		// @ts-expect-error - Check extraquery usage on this func
		const onHoldConversations = await this.roomsModel.getOnHoldConversationsBetweenDate(from, to, departmentId, extraQuery);

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
				value: `${busiestHour.from}${busiestHour.to ? ` - ${busiestHour.to}` : ''}`,
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
			lt: to.add(1, 'days').toDate(),
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
