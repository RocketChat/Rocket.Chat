/* eslint-disable new-cap */
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';
import { expect } from 'chai';
import moment from 'moment-timezone';
import sinon from 'sinon';

import { AgentOverviewData } from '../../../../../server/services/omnichannel-analytics/AgentData';

describe('AgentData Analytics', () => {
	describe('updateMap', () => {
		it('should update an empty map', () => {
			const map = new Map();
			const agentOverview = new AgentOverviewData({} as any);

			agentOverview.updateMap(map, 'test', 1);

			expect(map.get('test')).to.be.equal(1);
		});
		it('should update an existing key on a map', () => {
			const map = new Map();
			map.set('test', 1);
			const agentOverview = new AgentOverviewData({} as any);

			agentOverview.updateMap(map, 'test', 2);

			expect(map.get('test')).to.be.equal(3);
		});
	});

	describe('sortByValue', () => {
		it('should sort an array of objects by value key', () => {
			const agentOverview = new AgentOverviewData({} as any);
			const array = [{ value: '1' }, { value: '3' }, { value: '2' }];

			agentOverview.sortByValue(array);

			expect(array).to.be.deep.equal([{ value: '1' }, { value: '2' }, { value: '3' }]);
		});
		it('should sort an array of objects by value key in inverse order when `inv` is true', () => {
			const agentOverview = new AgentOverviewData({} as any);
			const array = [{ value: '1' }, { value: '3' }, { value: '2' }];

			agentOverview.sortByValue(array, true);

			expect(array).to.be.deep.equal([{ value: '3' }, { value: '2' }, { value: '1' }]);
		});
	});

	describe('isActionAllowed', () => {
		it('should return true when action is valid', () => {
			const agentOverview = new AgentOverviewData({} as any);

			expect(agentOverview.isActionAllowed('Total_conversations')).to.be.true;
		});
		it('should return false when action is invalid', () => {
			const agentOverview = new AgentOverviewData({} as any);

			expect(agentOverview.isActionAllowed('invalid')).to.be.false;
		});
		it('should return false when action is undefined', () => {
			const agentOverview = new AgentOverviewData({} as any);

			expect(agentOverview.isActionAllowed(undefined)).to.be.false;
		});
	});

	describe('callAction', () => {
		it('should throw an error when action is invalid', async () => {
			const agentOverview = new AgentOverviewData({} as any);

			try {
				// @ts-expect-error - test
				// eslint-disable-next-line prettier/prettier, no-return-await
				await agentOverview.callAction('invalid', moment(), moment());
			} catch (e) {
				expect(e).to.be.instanceOf(Error);
			}
		});
		it('should call a valid action', async () => {
			const mockModel = {
				getAnalyticsMetricsBetweenDateWithMessages: () => [],
				getAnalyticsMetricsBetweenDate: () => [],
			};

			const agentOverview = new AgentOverviewData(mockModel as any);

			const spy = sinon.spy(agentOverview, 'Total_conversations');
			const spy2 = sinon.spy(agentOverview, 'Total_messages');
			const spy3 = sinon.spy(agentOverview, 'Avg_chat_duration');
			const spy4 = sinon.spy(agentOverview, 'Avg_first_response_time');
			const spy5 = sinon.spy(agentOverview, 'Best_first_response_time');
			const spy6 = sinon.spy(agentOverview, 'Avg_reaction_time');
			const spy7 = sinon.spy(agentOverview, 'Avg_response_time');

			await agentOverview.callAction('Total_conversations', moment(), moment());

			expect(spy.calledOnce).to.be.true;

			await agentOverview.callAction('Total_messages', moment(), moment());

			expect(spy2.calledOnce).to.be.true;

			await agentOverview.callAction('Avg_chat_duration', moment(), moment());

			expect(spy3.calledOnce).to.be.true;

			await agentOverview.callAction('Avg_first_response_time', moment(), moment());

			expect(spy4.calledOnce).to.be.true;

			await agentOverview.callAction('Best_first_response_time', moment(), moment());

			expect(spy5.calledOnce).to.be.true;

			await agentOverview.callAction('Avg_reaction_time', moment(), moment());

			expect(spy6.calledOnce).to.be.true;

			await agentOverview.callAction('Avg_response_time', moment(), moment());

			expect(spy7.calledOnce).to.be.true;
		});
	});

	describe('Total_Conversations', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_conversations(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: '%_of_conversations' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_conversations(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '100.00%',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: '%_of_conversations' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data with multiple agents', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
						},
						{
							servedBy: {
								username: 'agent 2',
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_conversations(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '50.00%',
					},
					{
						name: 'agent 2',
						value: '50.00%',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: '%_of_conversations' },
				],
			});
		});
		it('should properly calculate when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
						},
						{
							servedBy: {
								username: 'agent 2',
							},
						},
						{
							servedBy: {
								username: 'agent 1',
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_conversations(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '66.67%',
					},
					{
						name: 'agent 2',
						value: '33.33%',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: '%_of_conversations' },
				],
			});
		});
		it('should ignore conversations that are not served by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: undefined,
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_conversations(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: '%_of_conversations' },
				],
			});
		});
	});

	describe('Avg_chat_duration', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_chat_duration(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_chat_duration' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								chatDuration: 100,
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_chat_duration(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:01:40',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_chat_duration' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data with multiple agents', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								chatDuration: 100,
							},
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							metrics: {
								chatDuration: 200,
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_chat_duration(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:01:40',
					},
					{
						name: 'agent 2',
						value: '00:03:20',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_chat_duration' },
				],
			});
		});
		it('should properly calculate when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								chatDuration: 100,
							},
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							metrics: {
								chatDuration: 200,
							},
						},
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								chatDuration: 200,
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_chat_duration(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:02:30',
					},
					{
						name: 'agent 2',
						value: '00:03:20',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_chat_duration' },
				],
			});
		});
		it('should ignore conversations not being served by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							metrics: {
								chatDuration: 100,
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_chat_duration(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_chat_duration' },
				],
			});
		});
		it('should ignore conversations with no metrics', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: undefined,
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							metrics: {},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_chat_duration(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_chat_duration' },
				],
			});
		});
	});

	describe('Total_messages', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDateWithMessages']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_messages(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Total_messages' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDateWithMessages']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							msgs: 10,
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_messages(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: 10,
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Total_messages' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data with multiple agents', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDateWithMessages']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							msgs: 10,
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							msgs: 20,
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_messages(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 2',
						value: 20,
					},
					{
						name: 'agent 1',
						value: 10,
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Total_messages' },
				],
			});
		});
		it('should properly calculate when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDateWithMessages']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							msgs: 10,
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							msgs: 20,
						},
						{
							servedBy: {
								username: 'agent 1',
							},
							msgs: 20,
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_messages(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: 30,
					},
					{
						name: 'agent 2',
						value: 20,
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Total_messages' },
				],
			});
		});
		it('should ignore conversations that are not served by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDateWithMessages(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDateWithMessages']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							msgs: 10,
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							msgs: 20,
						},
						{
							servedBy: undefined,
							msgs: 20,
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Total_messages(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 2',
						value: 20,
					},
					{
						name: 'agent 1',
						value: 10,
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Total_messages' },
				],
			});
		});
	});

	describe('Avg_first_response_time', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:01:40',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data with multiple agents', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:01:40',
					},
					{
						name: 'agent 2',
						value: '00:03:20',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should associate average first response time with the agent who first responded to the room', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 3',
							},
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
						{
							servedBy: {
								username: 'agent 4',
							},
							responseBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
						{
							servedBy: {
								username: 'agent 5',
							},
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:02:30',
					},
					{
						name: 'agent 2',
						value: '00:03:20',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should calculate correctly when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{
						name: 'agent 1',
						value: '00:02:30',
					},
					{
						name: 'agent 2',
						value: '00:03:20',
					},
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should ignore conversations not responded by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: undefined,
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should ignore conversations served, but not responded by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							responseBy: undefined,
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
		it('should ignore conversations with no metrics', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: undefined,
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Avg_first_response_time' },
				],
			});
		});
	});

	describe('Best_first_response_time', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 3',
							},
							metrics: {
								response: {
									ft: 50,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 4',
							},
							metrics: {
								response: {
									ft: 150,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 5',
							},
							metrics: {
								response: {
									ft: 250,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 6',
							},
							metrics: {
								response: {
									ft: 300,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:01:40' },
					{ name: 'agent 2', value: '00:03:20' },
					{ name: 'agent 3', value: '00:00:50' },
					{ name: 'agent 4', value: '00:02:30' },
					{ name: 'agent 5', value: '00:04:10' },
					{ name: 'agent 6', value: '00:05:00' },
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
		it('should associate best first response time with the agent who first responded to the room', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							servedBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 2',
							},
							servedBy: {
								username: 'agent 3',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 3',
							},
							servedBy: {
								username: 'agent 4',
							},
							metrics: {
								response: {
									ft: 50,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 4',
							},
							servedBy: {
								username: 'agent 5',
							},
							metrics: {
								response: {
									ft: 150,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 5',
							},
							servedBy: {
								username: 'agent 6',
							},
							metrics: {
								response: {
									ft: 250,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 6',
							},
							servedBy: {
								username: 'agent 7',
							},
							metrics: {
								response: {
									ft: 300,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:01:40' },
					{ name: 'agent 2', value: '00:03:20' },
					{ name: 'agent 3', value: '00:00:50' },
					{ name: 'agent 4', value: '00:02:30' },
					{ name: 'agent 5', value: '00:04:10' },
					{ name: 'agent 6', value: '00:05:00' },
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
		it('should properly calculate when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 100,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 3',
							},
							metrics: {
								response: {
									ft: 50,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 4',
							},
							metrics: {
								response: {
									ft: 150,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 5',
							},
							metrics: {
								response: {
									ft: 250,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 6',
							},
							metrics: {
								response: {
									ft: 300,
								},
							},
						},
						{
							responseBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									ft: 200,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:01:40' },
					{ name: 'agent 2', value: '00:03:20' },
					{ name: 'agent 3', value: '00:00:50' },
					{ name: 'agent 4', value: '00:02:30' },
					{ name: 'agent 5', value: '00:04:10' },
					{ name: 'agent 6', value: '00:05:00' },
				],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
		it('should ignore conversations not responded by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [{ responseBy: undefined, metrics: { response: { ft: 100 } } }];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
		it('should ignore conversations served, but not responded by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [{ servedBy: { username: 'agent1' }, responseBy: undefined, metrics: { response: { ft: 100 } } }];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
		it('should ignore conversations with no metrics', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [{ responseBy: { username: 'agent 1' }, metrics: undefined }];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Best_first_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{ name: 'Best_first_response_time' },
				],
			});
		});
	});

	describe('Avg_response_time', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									avg: 100,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [{ name: 'agent 1', value: '00:01:40' }],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data with multiple agents', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									avg: 100,
								},
							},
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									avg: 200,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:01:40' },
					{ name: 'agent 2', value: '00:03:20' },
				],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
			});
		});
		it('should calculate correctly when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									avg: 100,
								},
							},
						},
						{
							servedBy: {
								username: 'agent 2',
							},
							metrics: {
								response: {
									avg: 200,
								},
							},
						},
						{
							servedBy: {
								username: 'agent 1',
							},
							metrics: {
								response: {
									avg: 200,
								},
							},
						},
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:02:30' },
					{ name: 'agent 2', value: '00:03:20' },
				],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
			});
		});
		it('should ignore conversations not being served by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [{ servedBy: undefined, metrics: { response: { avg: 100 } } }];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
			});
		});
		it('should ignore conversations with no metrics', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [
						{ servedBy: { username: 'agent 1' }, metrics: undefined },
						{ servedBy: { username: 'agent 2' }, metrics: {} },
					];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_response_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_response_time',
					},
				],
			});
		});
	});

	describe('Avg_reaction_time', () => {
		it('should return an ConversationData object with empty data when model call returns empty array', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_reaction_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					return [{ servedBy: { username: 'agent 1' }, metrics: { reaction: { ft: 100 } } }];
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_reaction_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [{ name: 'agent 1', value: '00:01:40' }],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
			});
		});
		it('should return an ConversationData object with data when model call returns data with multiple agents', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					const data = [
						{ servedBy: { username: 'agent 1' }, metrics: { reaction: { ft: 100 } } },
						{ servedBy: { username: 'agent 2' }, metrics: { reaction: { ft: 200 } } },
					];

					return data;
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_reaction_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:01:40' },
					{ name: 'agent 2', value: '00:03:20' },
				],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
			});
		});
		it('should calculate correctly when agents have multiple conversations', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					const data = [
						{ servedBy: { username: 'agent 1' }, metrics: { reaction: { ft: 100 } } },
						{ servedBy: { username: 'agent 2' }, metrics: { reaction: { ft: 200 } } },
						{ servedBy: { username: 'agent 1' }, metrics: { reaction: { ft: 200 } } },
					];

					return data;
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_reaction_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [
					{ name: 'agent 1', value: '00:02:30' },
					{ name: 'agent 2', value: '00:03:20' },
				],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
			});
		});
		it('should ignore conversations not being served by any agent', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					const data = [{ servedBy: undefined, metrics: { reaction: { ft: 100 } } }];

					return data;
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_reaction_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
			});
		});
		it('should ignore conversations with no metrics', async () => {
			const modelMock = {
				getAnalyticsMetricsBetweenDate(_params: ILivechatRoomsModel['getAnalyticsMetricsBetweenDate']) {
					const data = [
						{ servedBy: { username: 'agent 1' }, metrics: undefined },
						{ servedBy: { username: 'agent 2' }, metrics: {} },
					];

					return data;
				},
			};

			const agentOverview = new AgentOverviewData(modelMock as any);

			const result = await agentOverview.Avg_reaction_time(moment(), moment(), 'departmentId');

			expect(result).to.be.deep.equal({
				data: [],
				head: [
					{
						name: 'Agent',
					},
					{
						name: 'Avg_reaction_time',
					},
				],
			});
		});
	});
});
