/* eslint-disable new-cap */
import { expect } from 'chai';
import sinon from 'sinon';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

import { conversations } from './mockData';
import { OverviewData } from '../../../../../server/services/omnichannel-analytics/OverviewData';

const analytics = (date: { gte: Date; lte: Date }) => {
	const gte = date.gte.getTime();
	const lte = date.lte.getTime();
	return conversations.filter((c) => {
		const ts = new Date(c.ts).getTime();
		return ts >= gte && ts <= lte;
	});
};

describe('OverviewData Analytics', () => {
	describe('isActionAllowed', () => {
		it('should return false if no action is provided', () => {
			const overview = new OverviewData({} as any);
			expect(overview.isActionAllowed(undefined)).to.be.false;
		});

		it('should return false if an invalid action is provided', () => {
			const overview = new OverviewData({} as any);
			expect(overview.isActionAllowed('invalid_action')).to.be.false;
		});

		it('should return true if a valid action is provided', () => {
			const overview = new OverviewData({} as any);
			expect(overview.isActionAllowed('Conversations')).to.be.true;
		});
	});

	describe('callAction', () => {
		it('should fail if the action is invalid', async () => {
			const overview = new OverviewData({} as any);
			try {
				// @ts-expect-error - Invalid action
				await overview.callAction('invalid_action', {} as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Invalid action');
			}
		});
		it('should call the correct action with the correct parameters', async () => {
			const overview = new OverviewData({
				getAnalyticsBetweenDate: () => [],
				getOnHoldConversationsBetweenDate: () => 0,
				getAnalyticsMetricsBetweenDate: () => [],
			} as any);

			const spy = sinon.spy(overview, 'Conversations');
			const spy2 = sinon.spy(overview, 'Productivity');

			await overview.callAction('Conversations', new Date(), new Date(), '', 'UTC');
			expect(spy.calledOnce).to.be.true;

			await overview.callAction('Productivity', new Date(), new Date(), '', 'UTC', (v: string): string => v);
			expect(spy2.calledOnce).to.be.true;
		});
	});

	describe('getKeyHavingMaxValue', () => {
		it('should return the key with the max value', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			map.set('a', 1);
			map.set('b', 2);
			map.set('c', 3);
			expect(overview.getKeyHavingMaxValue(map, 'd')).to.be.equal('c');
		});
		it('should return the default key if the map is empty', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			expect(overview.getKeyHavingMaxValue(map, 'd')).to.be.equal('d');
		});
	});

	describe('getAllMapKeysSize', () => {
		it('should return the sum of all map keys', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			map.set('a', 1);
			map.set('b', 2);
			map.set('c', 3);
			expect(overview.sumAllMapKeys(map)).to.be.equal(6);
		});
		it('should return 0 if the map is empty', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			expect(overview.sumAllMapKeys(map)).to.be.equal(0);
		});
	});

	describe('getBusiestDay', () => {
		it('should return the day with the most messages', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			map.set(
				'Monday',
				new Map([
					['1', 1],
					['2', 2],
				]),
			);
			map.set(
				'Tuesday',
				new Map([
					['13', 1],
					['15', 2],
				]),
			);
			map.set(
				'Sunday',
				new Map([
					['12', 2],
					['23', 2],
				]),
			);
			expect(overview.getBusiestDay(map)).to.be.equal('Sunday');
		});
		it('should return the first day with the most messages if theres a tie', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			map.set(
				'Monday',
				new Map([
					['1', 1],
					['2', 2],
				]),
			);
			map.set(
				'Tuesday',
				new Map([
					['13', 1],
					['15', 2],
				]),
			);
			map.set(
				'Sunday',
				new Map([
					['12', 1],
					['23', 2],
				]),
			);
			expect(overview.getBusiestDay(map)).to.be.equal('Monday');
		});
		it('should return the default key if the map is empty', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			expect(overview.getBusiestDay(map)).to.be.equal('-');
		});
	});

	describe('sumAllMapKeys', () => {
		it('should return the sum of all map keys', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			map.set('a', 1);
			map.set('b', 2);
			map.set('c', 3);
			expect(overview.sumAllMapKeys(map)).to.be.equal(6);
		});
		it('should return 0 if the map is empty', () => {
			const overview = new OverviewData({} as any);
			const map = new Map();
			expect(overview.sumAllMapKeys(map)).to.be.equal(0);
		});
	});

	describe('Conversations', () => {
		it('should return all values as 0 when theres no data', async () => {
			const overview = new OverviewData({
				getAnalyticsBetweenDate: () => [],
				getOnHoldConversationsBetweenDate: () => 0,
			} as any);
			const result = await overview.Conversations(new Date(), new Date(), '', 'UTC', (v: string): string => v, {});
			expect(result).to.be.deep.equal([
				{ title: 'Total_conversations', value: 0 },
				{ title: 'Open_conversations', value: 0 },
				{ title: 'On_Hold_conversations', value: 0 },
				{ title: 'Total_messages', value: 0 },
				{ title: 'Busiest_day', value: '-' },
				{ title: 'Conversations_per_day', value: '0.00' },
				{ title: 'Busiest_time', value: '-' },
			]);
		});
		it('should return all values as 0 when theres data but not on the period we pass', async () => {
			const overview = new OverviewData({
				getAnalyticsBetweenDate: () => analytics({ gte: new Date(new Date().getFullYear(), 9, 1), lte: new Date(new Date().getFullYear(), 9, 1) }),
				getOnHoldConversationsBetweenDate: () => 0,
			} as any);
			const result = await overview.Conversations(new Date(), new Date(), '', 'UTC', (v: string): string => v, {});
			expect(result).to.be.deep.equal([
				{ title: 'Total_conversations', value: 0 },
				{ title: 'Open_conversations', value: 0 },
				{ title: 'On_Hold_conversations', value: 0 },
				{ title: 'Total_messages', value: 0 },
				{ title: 'Busiest_day', value: '-' },
				{ title: 'Conversations_per_day', value: '0.00' },
				{ title: 'Busiest_time', value: '-' },
			]);
		});
		it('should return the correct values when theres data on the period we pass', async () => {
			const overview = new OverviewData({
				getAnalyticsBetweenDate: (date: { gte: Date; lte: Date }) => analytics(date),
				getOnHoldConversationsBetweenDate: () => 1,
			} as any);

			// Fixed date to assure we get the same data
			const d = new Date(Date.UTC(2023, 10, 12));
			const result = await overview.Conversations(
				startOfDay(d),
				endOfDay(d),
				'',
				'UTC',
				(v: string): string => v,
				{},
			);
			expect(result).to.be.deep.equal([
				{ title: 'Total_conversations', value: 1 },
				{ title: 'Open_conversations', value: 0 },
				{ title: 'On_Hold_conversations', value: 1 },
				{ title: 'Total_messages', value: 93 },
				{ title: 'Busiest_day', value: 'Sunday' },
				{ title: 'Conversations_per_day', value: '1.00' },
				{ title: 'Busiest_time', value: '11AM - 12PM' },
			]);
		});
		it('should only return conversation metrics related to the provided period, and not consider previous or following days', async () => {
			const overview = new OverviewData({
				getAnalyticsBetweenDate: (date: { gte: Date; lte: Date }) => analytics(date),
				getOnHoldConversationsBetweenDate: () => 1,
			} as any);

			// choosing this specific date since the day before and after are not empty
			const targetDate = new Date(Date.UTC(2023, 10, 23));

			// Fixed date to assure we get the same data
			const result = await overview.Conversations(startOfDay(targetDate), endOfDay(targetDate), '', 'UTC');
			expect(result).to.be.deep.equal([
				{ title: 'Total_conversations', value: 1 },
				{ title: 'Open_conversations', value: 0 },
				{ title: 'On_Hold_conversations', value: 1 },
				{ title: 'Total_messages', value: 14 },
				{ title: 'Busiest_day', value: 'Thursday' },
				{ title: 'Conversations_per_day', value: '1.00' },
				{ title: 'Busiest_time', value: '7AM - 8AM' },
			]);
		});
		it('should return all values as 0 when there is no data in the provided period, but there is data in the previous and following days', async () => {
			const overview = new OverviewData({
				getAnalyticsBetweenDate: (date: { gte: Date; lte: Date }) => analytics(date),
				getOnHoldConversationsBetweenDate: () => 0,
			} as any);

			// choosing this specific date since the day before and after are not empty
			const targetDate = new Date(Date.UTC(2023, 10, 13));

			const result = await overview.Conversations(startOfDay(targetDate), endOfDay(targetDate), '', 'UTC');
			expect(result).to.be.deep.equal([
				{ title: 'Total_conversations', value: 0 },
				{ title: 'Open_conversations', value: 0 },
				{ title: 'On_Hold_conversations', value: 0 },
				{ title: 'Total_messages', value: 0 },
				{ title: 'Busiest_day', value: '-' },
				{ title: 'Conversations_per_day', value: '0.00' },
				{ title: 'Busiest_time', value: '-' },
			]);
		});
	});

	describe('Productivity', () => {
		it('should return all values as 0 when theres no data', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: () => ({
					forEach: () => [],
				}),
			} as any);
			const result = await overview.Productivity(new Date(), new Date(), '', 'UTC', (v: string): string => v, {});
			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:00' },
				{ title: 'Avg_first_response_time', value: '00:00:00' },
				{ title: 'Avg_reaction_time', value: '00:00:00' },
			]);
		});
		it('should return all values as 0 when theres data but not on the period we pass', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: (_: any, date: { gte: Date; lte: Date }) => analytics(date),
			} as any);
			const sept = new Date(new Date().getFullYear(), 9, 1);
			const result = await overview.Productivity(sept, sept, '', 'UTC', (v: string): string => v, {});
			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:00' },
				{ title: 'Avg_first_response_time', value: '00:00:00' },
				{ title: 'Avg_reaction_time', value: '00:00:00' },
			]);
		});
		it('should return the correct values when theres data on the period we pass', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: (_: any, date: { gte: Date; lte: Date }) => analytics(date),
			} as any);
			const result = await overview.Productivity(
				startOfMonth(new Date(2023, 10, 1)),
				endOfMonth(new Date(2023, 10, 1)),
				'',
				'UTC',
			);

			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:07' },
				{ title: 'Avg_first_response_time', value: '00:00:10' },
				{ title: 'Avg_reaction_time', value: '00:00:49' },
			]);
		});
		it('should only return productivity metrics related to the provided period, and not consider previous or following days', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: (_: any, date: { gte: Date; lte: Date }) => analytics(date),
			} as any);

			// choosing this specific date since the day before and after are not empty
			const targetDate = new Date(2023, 10, 25);

			const result = await overview.Productivity(startOfDay(targetDate), endOfDay(targetDate), '', 'UTC');

			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:01' },
				{ title: 'Avg_first_response_time', value: '00:00:04' },
				{ title: 'Avg_reaction_time', value: '00:02:03' },
			]);
		});
		it('should return all values as 0 when there is no data in the provided period, but there is data in the previous and following days', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: (_: any, date: { gte: Date; lte: Date }) => analytics(date),
			} as any);

			// choosing this specific date since the day before and after are not empty
			const targetDate = new Date(Date.UTC(2023, 10, 13));

			const result = await overview.Productivity(startOfDay(targetDate), endOfDay(targetDate), '', 'UTC');

			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:00' },
				{ title: 'Avg_first_response_time', value: '00:00:00' },
				{ title: 'Avg_reaction_time', value: '00:00:00' },
			]);
		});
	});
});
