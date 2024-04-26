/* eslint-disable new-cap */
import { expect } from 'chai';
import moment from 'moment';
import sinon from 'sinon';

import { OverviewData } from '../../../../../server/services/omnichannel-analytics/OverviewData';
import { conversations } from './mockData';

const analytics = (date: { gte: Date; lt: Date }) => {
	// filter the mockData array with the date param with moment
	return conversations.filter((c) => moment(c.ts).isBetween(date.gte, date.lt));
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

			await overview.callAction('Conversations', moment(), moment(), '', 'UTC');
			expect(spy.calledOnce).to.be.true;

			await overview.callAction('Productivity', moment(), moment(), '', 'UTC', (v: string): string => v);
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
			const result = await overview.Conversations(moment(), moment(), '', 'UTC', (v: string): string => v, {});
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
				getAnalyticsBetweenDate: () => analytics({ gte: moment().set('month', 9).toDate(), lt: moment().set('month', 9).toDate() }),
				getOnHoldConversationsBetweenDate: () => 0,
			} as any);
			const result = await overview.Conversations(moment(), moment(), '', 'UTC', (v: string): string => v, {});
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
				getAnalyticsBetweenDate: (date: { gte: Date; lt: Date }) => analytics(date),
				getOnHoldConversationsBetweenDate: () => 1,
			} as any);

			// Fixed date to assure we get the same data
			const result = await overview.Conversations(
				moment.utc().set('month', 10).set('year', 2023).set('date', 12).startOf('day'),
				moment.utc().set('month', 10).set('year', 2023).set('date', 12).endOf('day'),
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
	});

	describe('Productivity', () => {
		it('should return all values as 0 when theres no data', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: () => ({
					forEach: () => [],
				}),
			} as any);
			const result = await overview.Productivity(moment(), moment(), '', 'UTC', (v: string): string => v, {});
			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:00' },
				{ title: 'Avg_first_response_time', value: '00:00:00' },
				{ title: 'Avg_reaction_time', value: '00:00:00' },
			]);
		});
		it('should return all values as 0 when theres data but not on the period we pass', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: (_: any, date: { gte: Date; lt: Date }) => analytics(date),
			} as any);
			const result = await overview.Productivity(
				moment().set('month', 9),
				moment().set('month', 9),
				'',
				'UTC',
				(v: string): string => v,
				{},
			);
			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:00' },
				{ title: 'Avg_first_response_time', value: '00:00:00' },
				{ title: 'Avg_reaction_time', value: '00:00:00' },
			]);
		});
		it('should return the correct values when theres data on the period we pass', async () => {
			const overview = new OverviewData({
				getAnalyticsMetricsBetweenDate: (_: any, date: { gte: Date; lt: Date }) => analytics(date),
			} as any);
			const result = await overview.Productivity(
				moment().set('month', 10).set('year', 2023).startOf('month'),
				moment().set('month', 10).set('year', 2023).endOf('month'),
				'',
				'UTC',
			);

			expect(result).to.be.deep.equal([
				{ title: 'Avg_response_time', value: '00:00:07' },
				{ title: 'Avg_first_response_time', value: '00:00:10' },
				{ title: 'Avg_reaction_time', value: '00:00:49' },
			]);
		});
	});
});
