/* eslint-disable new-cap */
import { expect } from 'chai';
import sinon from 'sinon';

import { ChartData } from '../../../../../server/services/omnichannel-analytics/ChartData';

describe('ChartData Analytics', () => {
	describe('isActionAllowed', () => {
		it('should return false if no action is provided', () => {
			const chart = new ChartData({} as any);
			expect(chart.isActionAllowed(undefined)).to.be.false;
		});

		it('should return false if an invalid action is provided', () => {
			const chart = new ChartData({} as any);
			expect(chart.isActionAllowed('invalid_action')).to.be.false;
		});

		it('should return true if a valid action is provided', () => {
			const chart = new ChartData({} as any);
			expect(chart.isActionAllowed('Total_conversations')).to.be.true;
		});
	});

	describe('callAction', () => {
		it('should call the correct action', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDateWithMessages: () => [],
				getAnalyticsMetricsBetweenDate: () => [],
				getTotalConversationsBetweenDate: () => 0,
			} as any);
			expect(await chart.callAction('Total_conversations', {} as any)).to.be.equal(0);
		});
		it('should throw an error if the action is invalid', async () => {
			const chart = new ChartData({} as any);
			try {
				// @ts-expect-error - Invalid action
				await chart.callAction('invalid_action', {} as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Invalid action');
			}
		});
		it('should call the correct action with the correct parameters', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDateWithMessages: () => [],
				getAnalyticsMetricsBetweenDate: () => [],
				getTotalConversationsBetweenDate: () => 0,
			} as any);

			const spy = sinon.spy(chart, 'Total_conversations');
			const spy2 = sinon.spy(chart, 'Avg_chat_duration');
			const spy3 = sinon.spy(chart, 'Total_messages');
			const spy4 = sinon.spy(chart, 'Avg_first_response_time');
			const spy5 = sinon.spy(chart, 'Avg_reaction_time');

			await chart.callAction('Total_conversations', {} as any);
			expect(spy.calledOnce).to.be.true;

			await chart.callAction('Avg_chat_duration', {} as any);
			expect(spy2.calledOnce).to.be.true;

			await chart.callAction('Total_messages', {} as any);
			expect(spy3.calledOnce).to.be.true;

			await chart.callAction('Avg_first_response_time', {} as any);
			expect(spy4.calledOnce).to.be.true;

			await chart.callAction('Avg_reaction_time', {} as any);
			expect(spy5.calledOnce).to.be.true;
		});
	});

	describe('Total_conversations', () => {
		it('should return the total number of conversations', async () => {
			const chart = new ChartData({
				getTotalConversationsBetweenDate: async () => 10,
			} as any);
			expect(await chart.Total_conversations({} as any)).to.be.equal(10);
		});
	});

	describe('Avg_chat_duration', () => {
		it('should return the average chat duration', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { chatDuration: 10 } }],
			} as any);
			expect(await chart.Avg_chat_duration({} as any)).to.be.equal(10);
		});
		it('should properly calculate with more conversations', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { chatDuration: 10 } }, { metrics: { chatDuration: 20 } }],
			} as any);
			expect(await chart.Avg_chat_duration({} as any)).to.be.equal(15);
		});
		it('should return 0 if no conversations are found', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [],
			} as any);
			expect(await chart.Avg_chat_duration({} as any)).to.be.equal(0);
		});
		it('should ignore conversations without chatDuration', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { chatDuration: 10 } }, { metrics: {} }],
			} as any);
			expect(await chart.Avg_chat_duration({} as any)).to.be.equal(10);
		});
	});

	describe('Total_messages', () => {
		it('should return the total number of messages', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDateWithMessages: () => [{ msgs: 10 }],
			} as any);
			expect(await chart.Total_messages({} as any)).to.be.equal(10);
		});
		it('should properly calculate with more conversations', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDateWithMessages: () => [{ msgs: 10 }, { msgs: 20 }],
			} as any);
			expect(await chart.Total_messages({} as any)).to.be.equal(30);
		});
		it('should return 0 if no conversations are found', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDateWithMessages: () => [],
			} as any);
			expect(await chart.Total_messages({} as any)).to.be.equal(0);
		});
		it('should ignore conversations without msgs', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDateWithMessages: () => [{ msgs: 10 }, {}],
			} as any);
			expect(await chart.Total_messages({} as any)).to.be.equal(10);
		});
	});

	describe('Avg_first_response_time', () => {
		it('should return the average first response time', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { ft: 10 } } }],
			} as any);
			expect(await chart.Avg_first_response_time({} as any)).to.be.equal(10);
		});
		it('should properly calculate with more conversations', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { ft: 10 } } }, { metrics: { response: { ft: 20 } } }],
			} as any);
			expect(await chart.Avg_first_response_time({} as any)).to.be.equal(15);
		});
		it('should return 0 if no conversations are found', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [],
			} as any);
			expect(await chart.Avg_first_response_time({} as any)).to.be.equal(0);
		});
		it('should ignore conversations without response', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { ft: 10 } } }, { metrics: {} }],
			} as any);
			expect(await chart.Avg_first_response_time({} as any)).to.be.equal(10);
		});
	});

	describe('Best_first_response_time', () => {
		it('should return the best first response time', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { ft: 10 } } }],
			} as any);
			expect(await chart.Best_first_response_time({} as any)).to.be.equal(10);
		});
		it('should properly calculate with more conversations', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { ft: 10 } } }, { metrics: { response: { ft: 20 } } }],
			} as any);
			expect(await chart.Best_first_response_time({} as any)).to.be.equal(10);
		});
		it('should return 0 if no conversations are found', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [],
			} as any);
			expect(await chart.Best_first_response_time({} as any)).to.be.equal(0);
		});
		it('should ignore conversations without response', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { ft: 10 } } }, { metrics: {} }],
			} as any);
			expect(await chart.Best_first_response_time({} as any)).to.be.equal(10);
		});
	});

	describe('Avg_response_time', () => {
		it('should return the average response time', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { avg: 10 } } }],
			} as any);
			expect(await chart.Avg_response_time({} as any)).to.be.equal(10);
		});
		it('should properly calculate with more conversations', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { avg: 10 } } }, { metrics: { response: { avg: 20 } } }],
			} as any);
			expect(await chart.Avg_response_time({} as any)).to.be.equal(15);
		});
		it('should return 0 if no conversations are found', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [],
			} as any);
			expect(await chart.Avg_response_time({} as any)).to.be.equal(0);
		});
		it('should ignore conversations without response', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { response: { avg: 10 } } }, { metrics: {} }],
			} as any);
			expect(await chart.Avg_response_time({} as any)).to.be.equal(10);
		});
	});

	describe('Avg_reaction_time', () => {
		it('should return the average reaction time', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { reaction: { ft: 10 } } }],
			} as any);
			expect(await chart.Avg_reaction_time({} as any)).to.be.equal(10);
		});
		it('should properly calculate with more conversations', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { reaction: { ft: 10 } } }, { metrics: { reaction: { ft: 20 } } }],
			} as any);
			expect(await chart.Avg_reaction_time({} as any)).to.be.equal(15);
		});
		it('should return 0 if no conversations are found', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [],
			} as any);
			expect(await chart.Avg_reaction_time({} as any)).to.be.equal(0);
		});
		it('should ignore conversations without reaction', async () => {
			const chart = new ChartData({
				getAnalyticsMetricsBetweenDate: () => [{ metrics: { reaction: { ft: 10 } } }, { metrics: {} }],
			} as any);
			expect(await chart.Avg_reaction_time({} as any)).to.be.equal(10);
		});
	});
});
