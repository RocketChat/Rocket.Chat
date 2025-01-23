import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import type { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import moment from 'moment';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { addOrRemoveAgentFromDepartment, createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import {
	closeOmnichannelRoom,
	placeRoomOnHold,
	sendAgentMessage,
	sendMessage,
	startANewLivechatRoomAndTakeIt,
} from '../../../data/livechat/rooms';
import { createAnOnlineAgent, createBotAgent } from '../../../data/livechat/users';
import { sleep } from '../../../data/livechat/utils';
import { removePermissionFromAllRoles, restorePermissionToRoles, updateEESetting, updateSetting } from '../../../data/permissions.helper';
import { deleteUser } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - dashboards', function () {
	// This test is expected to take more time since we're simulating real time conversations to verify analytics
	this.timeout(60000);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateEESetting('Livechat_Require_Contact_Verification', 'never');
	});

	let department: ILivechatDepartment;
	const agents: {
		credentials: Credentials;
		user: IUser & { username: string };
	}[] = [];
	let avgClosedRoomChatDuration = 0;

	const inactivityTimeout = 3;

	const TOTAL_MESSAGES = {
		min: 5,
		max: 10,
	};
	const DELAY_BETWEEN_MESSAGES = {
		min: 1000,
		max: (inactivityTimeout - 1) * 1000,
	};
	const TOTAL_ROOMS = 7;

	const simulateRealtimeConversation = async (chatInfo: Awaited<ReturnType<typeof startANewLivechatRoomAndTakeIt>>[]) => {
		const promises = chatInfo.map(async (info) => {
			const { room, visitor } = info;

			// send a few messages
			const numberOfMessages = Random.between(TOTAL_MESSAGES.min, TOTAL_MESSAGES.max);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for await (const _ of Array(numberOfMessages - 1).keys()) {
				// flip a coin to decide who will send the message
				const willSendFromAgent = Random.between(0, 1) === 1;

				if (willSendFromAgent) {
					await sendAgentMessage(room._id);
				} else {
					await sendMessage(room._id, faker.lorem.sentence(), visitor.token);
				}

				const delay = Random.between(DELAY_BETWEEN_MESSAGES.min, DELAY_BETWEEN_MESSAGES.max);
				await sleep(delay);
			}

			// Last message is always from visitor so that the chat doesn't get abandoned due to
			// "Livechat_visitor_inactivity_timeout" setting
			await sendMessage(room._id, faker.lorem.sentence(), visitor.token);
		});

		await Promise.all(promises);
	};

	before(async () => {
		if (!IS_EE) {
			return;
		}

		await updateSetting('Livechat_visitor_inactivity_timeout', inactivityTimeout);
		await updateSetting('Livechat_enable_business_hours', false);

		// create dummy test data for further tests
		const { department: createdDept, agent: agent1 } = await createDepartmentWithAnOnlineAgent();
		department = createdDept;

		const agent2 = await createAnOnlineAgent();
		await addOrRemoveAgentFromDepartment(department._id, { agentId: agent2.user._id, username: agent2.user.username }, true);
		agents.push(agent1);
		agents.push(agent2);

		const roomCreationStart = moment();
		// start a few chats
		const promises = Array.from(Array(TOTAL_ROOMS).keys()).map((i) => {
			// 2 rooms by agent 1
			if (i < 2) {
				return startANewLivechatRoomAndTakeIt({ departmentId: department._id, agent: agent1.credentials });
			}
			return startANewLivechatRoomAndTakeIt({ departmentId: department._id, agent: agent2.credentials });
		});

		const results = await Promise.all(promises);

		const chatInfo = results.map((result) => ({ room: result.room, visitor: result.visitor }));

		// simulate messages being exchanged between agents and visitors
		await simulateRealtimeConversation(chatInfo);

		// put a chat on hold
		await sendAgentMessage(chatInfo[1].room._id);
		await placeRoomOnHold(chatInfo[1].room._id);
		// close a chat
		await closeOmnichannelRoom(chatInfo[4].room._id);
		const room5ChatDuration = moment().diff(roomCreationStart, 'seconds');
		// close an abandoned chat
		await sendAgentMessage(chatInfo[5].room._id);
		await sleep(inactivityTimeout * 1000); // wait for the chat to be considered abandoned
		await closeOmnichannelRoom(chatInfo[5].room._id);
		const room6ChatDuration = moment().diff(roomCreationStart, 'seconds');

		avgClosedRoomChatDuration = (room5ChatDuration + room6ChatDuration) / 2;
	});

	describe('livechat/analytics/dashboards/conversation-totalizers', () => {
		const expectedMetrics = [
			'Total_conversations',
			'Open_conversations',
			'On_Hold_conversations',
			'Total_messages',
			'Busiest_time',
			'Total_abandoned_chats',
			'Total_visitors',
		];
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/conversation-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an array of conversation totalizers', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/conversation-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.totalizers).to.be.an('array');
					(res.body.totalizers as { title: string; value: string }[]).forEach(
						(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
					);
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/conversation-totalizers'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('totalizers');
			expect(result.body.totalizers).to.be.an('array');
			expect(result.body.totalizers).to.have.lengthOf(5);

			const expectedResult = [
				{ title: 'Total_conversations', value: 7 },
				{ title: 'Open_conversations', value: 4 },
				{ title: 'On_Hold_conversations', value: 1 },
				// { title: 'Total_messages', value: 60 },
				{ title: 'Total_visitors', value: 7 },
			];

			expectedResult.forEach((expected) => {
				const resultItem = result.body.totalizers.find((item: any) => item.title === expected.title);
				expect(resultItem).to.not.be.undefined;
				expect(resultItem).to.have.property('value', expected.value);
			});

			const minMessages = TOTAL_MESSAGES.min * TOTAL_ROOMS;

			const totalMessages = result.body.totalizers.find((item: any) => item.title === 'Total_messages');
			expect(totalMessages).to.not.be.undefined;
			const totalMessagesValue = parseInt(totalMessages.value);
			expect(totalMessagesValue).to.be.greaterThanOrEqual(minMessages);
		});
	});

	describe('livechat/analytics/dashboards/productivity-totalizers', () => {
		const expectedMetrics = ['Avg_response_time', 'Avg_first_response_time', 'Avg_reaction_time', 'Avg_of_waiting_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/productivity-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an array of productivity totalizers', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/productivity-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.totalizers).to.be.an('array');
					(res.body.totalizers as { title: string; value: string }[]).forEach(
						(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
					);
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/productivity-totalizers'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);

			// const expected = [
			// 	// There's a bug in the code for calculation of these 3 values.
			// 	// Due to which it always return 0
			// 	{ title: 'Avg_response_time', value: '00:00:00' },
			// 	{ title: 'Avg_first_response_time', value: '00:00:00' },
			// 	{ title: 'Avg_reaction_time', value: '00:00:00' },

			// 	{ title: 'Avg_of_waiting_time', value: '00:00:03' }, // approx 3, 5 delta
			// ];

			const avgWaitingTime = result.body.totalizers.find((item: any) => item.title === 'Avg_of_waiting_time');
			expect(avgWaitingTime).to.not.be.undefined;

			/* const avgWaitingTimeValue = moment.duration(avgWaitingTime.value).asSeconds();
			expect(avgWaitingTimeValue).to.be.closeTo(DELAY_BETWEEN_MESSAGES.max / 1000, 5); */
		});
	});

	describe('livechat/analytics/dashboards/chats-totalizers', () => {
		const expectedMetrics = ['Total_abandoned_chats', 'Avg_of_abandoned_chats', 'Avg_of_chat_duration_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/chats-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an array of chats totalizers', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/chats-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.totalizers).to.be.an('array');
					(res.body.totalizers as { title: string; value: string }[]).forEach(
						(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
					);
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/chats-totalizers'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			const expected = [
				{ title: 'Total_abandoned_chats', value: 1 },
				{ title: 'Avg_of_abandoned_chats', value: '14%' },
				// { title: 'Avg_of_chat_duration_time', value: '00:00:01' },
			];

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('totalizers');
			expect(result.body.totalizers).to.be.an('array');

			expected.forEach((expected) => {
				const resultItem = result.body.totalizers.find((item: any) => item.title === expected.title);
				expect(resultItem).to.not.be.undefined;
				expect(resultItem).to.have.property('value', expected.value);
			});

			const resultAverageChatDuration = result.body.totalizers.find((item: any) => item.title === 'Avg_of_chat_duration_time');
			expect(resultAverageChatDuration).to.not.be.undefined;

			const resultAverageChatDurationValue = moment.duration(resultAverageChatDuration.value).asSeconds();
			expect(resultAverageChatDurationValue).to.be.closeTo(avgClosedRoomChatDuration, 5); // Keep a margin of 3 seconds
		});
	});

	describe('livechat/analytics/dashboards/agents-productivity-totalizers', () => {
		const expectedMetrics = ['Busiest_time', 'Avg_of_available_service_time', 'Avg_of_service_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/agents-productivity-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an array of agents productivity totalizers', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/agents-productivity-totalizers'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.totalizers).to.be.an('array');
					(res.body.totalizers as { title: string; value: string }[]).forEach(
						(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
					);
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/agents-productivity-totalizers'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			// [
			//     { title: 'Busiest_time', value: '- -' },
			//     { title: 'Avg_of_available_service_time', value: '00:00:00' },
			//     { title: 'Avg_of_service_time', value: '00:00:16' } approx 17, 6 delta
			//   ],

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('totalizers');
			expect(result.body.totalizers).to.be.an('array');

			const avgServiceTime = result.body.totalizers.find((item: any) => item.title === 'Avg_of_service_time');

			expect(avgServiceTime).to.not.be.undefined;
			const avgServiceTimeValue = moment.duration(avgServiceTime.value).asSeconds();
			const minChatDuration = (DELAY_BETWEEN_MESSAGES.min * TOTAL_MESSAGES.min) / 1000;
			const maxChatDuration = (DELAY_BETWEEN_MESSAGES.max * TOTAL_MESSAGES.max) / 1000;
			expect(avgServiceTimeValue).to.be.closeTo((minChatDuration + maxChatDuration) / 2, 10);
		});
	});

	describe('livechat/analytics/dashboards/charts/chats', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/chats'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an array of productivity totalizers', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/chats'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('open');
					expect(res.body).to.have.property('closed');
					expect(res.body).to.have.property('queued');
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/charts/chats'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			const expected = {
				open: 4,
				closed: 2,
				queued: 0,
				onhold: 1,
			};

			expect(result.body).to.have.property('success', true);

			Object.entries(expected).forEach(([key, value]) => {
				expect(result.body).to.have.property(key, value);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/chats-per-agent', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/chats-per-agent'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an object with open and closed chats by agent', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/chats-per-agent'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/charts/chats-per-agent'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			const expected = {
				agent0: { open: 1, closed: 0, onhold: 1 },
				agent1: { open: 3, closed: 2 },
			};

			expect(result.body).to.have.property('success', true);

			const agent0 = result.body[agents[0].user.username as string];
			const agent1 = result.body[agents[1].user.username as string];

			Object.entries(expected.agent0).forEach(([key, value]) => {
				expect(agent0).to.have.property(key, value);
			});
			Object.entries(expected.agent1).forEach(([key, value]) => {
				expect(agent1).to.have.property(key, value);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/agents-status', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/agents-status'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an object with agents status metrics', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/agents-status'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offline');
					expect(res.body).to.have.property('away');
					expect(res.body).to.have.property('busy');
					expect(res.body).to.have.property('available');
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/charts/agents-status'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			// TODO: We can improve tests further by creating some agents with different status
			const expected = {
				offline: 0,
				away: 0,
				busy: 0,
				available: 2,
			};

			expect(result.body).to.have.property('success', true);

			Object.entries(expected).forEach(([key, value]) => {
				expect(result.body).to.have.property(key, value);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/chats-per-department', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/chats-per-department'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an object with open and closed chats by department', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/chats-per-department'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/charts/chats-per-department'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			const expected = {
				department0: { open: 5, closed: 2 },
			};

			expect(result.body).to.have.property('success', true);

			const department0 = result.body[department.name];

			Object.entries(expected.department0).forEach(([key, value]) => {
				expect(department0).to.have.property(key, value);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/timings', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/timings'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an object with open and closed chats by department', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/dashboards/charts/timings'))
				.query({
					start: '2019-10-25T15:08:17.248Z',
					end: '2019-12-08T15:08:17.248Z',
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('response');
					expect(res.body).to.have.property('reaction');
					expect(res.body).to.have.property('chatDuration');
					expect(res.body.response).to.have.property('avg');
					expect(res.body.response).to.have.property('longest');
					expect(res.body.reaction).to.have.property('avg');
					expect(res.body.reaction).to.have.property('longest');
					expect(res.body.chatDuration).to.have.property('avg');
					expect(res.body.chatDuration).to.have.property('longest');
				});
		});
		(IS_EE ? it : it.skip)('should return data with correct values', async () => {
			const start = moment().subtract(1, 'days').toISOString();
			const end = moment().toISOString();

			const result = await request
				.get(api('livechat/analytics/dashboards/charts/timings'))
				.query({ start, end, departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);

			// const expected = {
			// 	response: { avg: 0, longest: 0.207 }, // avg between delayBetweenMessage.min and delayBetweenMessage.max
			// 	reaction: { avg: 0, longest: 0.221 }, // avg between delayBetweenMessage.min and delayBetweenMessage.max
			// 	chatDuration: { avg: 0, longest: 0.18 }, // avg should be about avgClosedRoomChatDuration, and longest should be greater than avgClosedRoomChatDuration and within delta of 20
			// 	success: true,
			// };

			const maxChatDuration = (DELAY_BETWEEN_MESSAGES.max * TOTAL_MESSAGES.max) / 1000;

			const responseValues = result.body.response;
			expect(responseValues).to.have.property('avg');
			expect(responseValues).to.have.property('longest');
			expect(responseValues.avg).to.be.closeTo((DELAY_BETWEEN_MESSAGES.min + DELAY_BETWEEN_MESSAGES.max) / 2000, 5);
			expect(responseValues.longest).to.be.lessThan(maxChatDuration);

			const reactionValues = result.body.reaction;
			expect(reactionValues).to.have.property('avg');
			expect(reactionValues).to.have.property('longest');
			expect(reactionValues.avg).to.be.closeTo((DELAY_BETWEEN_MESSAGES.min + DELAY_BETWEEN_MESSAGES.max) / 2000, 5);
			expect(reactionValues.longest).to.be.lessThan(maxChatDuration);

			const chatDurationValues = result.body.chatDuration;
			expect(chatDurationValues).to.have.property('avg');
			expect(chatDurationValues).to.have.property('longest');
			expect(chatDurationValues.avg).to.be.closeTo(avgClosedRoomChatDuration, 5);
			expect(chatDurationValues.longest).to.be.greaterThan(avgClosedRoomChatDuration);
			expect(chatDurationValues.longest).to.be.lessThan(avgClosedRoomChatDuration + 20);
		});
	});

	describe('livechat/analytics/agent-overview', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: 'Total_conversations' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an "invalid-chart-name error" when the chart name is empty', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: '' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should return empty when chart name is invalid', async () => {
			await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: 'invalid-chart-name' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(Object.keys(res.body)).to.have.lengthOf(1);
				});
		});
		it('should return an array of agent overview data', async () => {
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: 'Total_conversations' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.head).to.be.an('array');
			expect(result.body.data).to.be.an('array');
		});
		(IS_EE ? it : it.skip)('should return agent overview data with correct values', async () => {
			const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
			const today = moment().startOf('day').format('YYYY-MM-DD');

			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: yesterday, to: today, name: 'Total_conversations', departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');
			expect(result.body.data).to.have.lengthOf(2);

			const user1Data = result.body.data.find((data: any) => data.name === agents[0].user.username);
			const user2Data = result.body.data.find((data: any) => data.name === agents[1].user.username);

			expect(user1Data).to.not.be.undefined;
			expect(user2Data).to.not.be.undefined;

			expect(user1Data).to.have.property('value', '28.57%');
			expect(user2Data).to.have.property('value', '71.43%');
		});
		(IS_EE ? it : it.skip)('should only return results in the provided date interval when searching for total conversations', async () => {
			const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: yesterday, to: yesterday, name: 'Total_conversations', departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body.head).to.be.an('array').with.lengthOf(2);
			expect(result.body.head[0]).to.have.property('name', 'Agent');
			expect(result.body.head[1]).to.have.property('name', '%_of_conversations');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array').that.is.empty;
		});
		(IS_EE ? it : it.skip)(
			'should only return results in the provided date interval when searching for average chat durations',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/agent-overview'))
					.query({ from: yesterday, to: yesterday, name: 'Avg_chat_duration', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.have.property('success', true);
				expect(result.body).to.have.property('head');
				expect(result.body.head).to.be.an('array').with.lengthOf(2);
				expect(result.body.head[0]).to.have.property('name', 'Agent');
				expect(result.body.head[1]).to.have.property('name', 'Avg_chat_duration');
				expect(result.body).to.have.property('data');
				expect(result.body.data).to.be.an('array').that.is.empty;
			},
		);
		(IS_EE ? it : it.skip)('should only return results in the provided date interval when searching for total messages', async () => {
			const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: yesterday, to: yesterday, name: 'Total_messages', departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body.head).to.be.an('array').with.lengthOf(2);
			expect(result.body.head[0]).to.have.property('name', 'Agent');
			expect(result.body.head[1]).to.have.property('name', 'Total_messages');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array').that.is.empty;
		});
		(IS_EE ? it : it.skip)(
			'should only return results in the provided date interval when searching for average first response times',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/agent-overview'))
					.query({ from: yesterday, to: yesterday, name: 'Avg_first_response_time', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.have.property('success', true);
				expect(result.body).to.have.property('head');
				expect(result.body.head).to.be.an('array').with.lengthOf(2);
				expect(result.body.head[0]).to.have.property('name', 'Agent');
				expect(result.body.head[1]).to.have.property('name', 'Avg_first_response_time');
				expect(result.body).to.have.property('data');
				expect(result.body.data).to.be.an('array').that.is.empty;
			},
		);
		(IS_EE ? it : it.skip)(
			'should only return results in the provided date interval when searching for best first response times',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/agent-overview'))
					.query({ from: yesterday, to: yesterday, name: 'Best_first_response_time', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.have.property('success', true);
				expect(result.body).to.have.property('head');
				expect(result.body.head).to.be.an('array').with.lengthOf(2);
				expect(result.body.head[0]).to.have.property('name', 'Agent');
				expect(result.body.head[1]).to.have.property('name', 'Best_first_response_time');
				expect(result.body).to.have.property('data');
				expect(result.body.data).to.be.an('array').that.is.empty;
			},
		);
		(IS_EE ? it : it.skip)(
			'should only return results in the provided date interval when searching for average response times',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/agent-overview'))
					.query({ from: yesterday, to: yesterday, name: 'Avg_response_time', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.have.property('success', true);
				expect(result.body).to.have.property('head');
				expect(result.body.head).to.be.an('array').with.lengthOf(2);
				expect(result.body.head[0]).to.have.property('name', 'Agent');
				expect(result.body.head[1]).to.have.property('name', 'Avg_response_time');
				expect(result.body).to.have.property('data');
				expect(result.body.data).to.be.an('array').that.is.empty;
			},
		);
		(IS_EE ? it : it.skip)(
			'should only return results in the provided date interval when searching for average reaction times',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/agent-overview'))
					.query({ from: yesterday, to: yesterday, name: 'Avg_reaction_time', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.have.property('success', true);
				expect(result.body).to.have.property('head');
				expect(result.body.head).to.be.an('array').with.lengthOf(2);
				expect(result.body.head[0]).to.have.property('name', 'Agent');
				expect(result.body.head[1]).to.have.property('name', 'Avg_reaction_time');
				expect(result.body).to.have.property('data');
				expect(result.body.data).to.be.an('array').that.is.empty;
			},
		);
	});

	describe('[livechat/analytics/agent-overview] - Average first response time', () => {
		let agent: { credentials: Credentials; user: IUser & { username: string } };
		let forwardAgent: { credentials: Credentials; user: IUser & { username: string } };
		let botAgent: { credentials: Credentials; user: IUser };
		let originalFirstResponseTimeInSeconds: number;
		let roomId: string;
		const firstDelayInSeconds = 4;
		const secondDelayInSeconds = 8;

		before(async () => {
			agent = await createAnOnlineAgent();
			forwardAgent = await createAnOnlineAgent();
			botAgent = await createBotAgent();

			await updateSetting('Omnichannel_Metrics_Ignore_Automatic_Messages', true);
		});

		after(async () =>
			Promise.all([
				deleteUser(agent.user),
				deleteUser(forwardAgent.user),
				updateSetting('Omnichannel_Metrics_Ignore_Automatic_Messages', false),
			]),
		);

		it('should return no average response time for an agent if no response has been sent in the period', async () => {
			await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });

			const today = moment().startOf('day').format('YYYY-MM-DD');

			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Avg_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');
			expect(result.body.data).to.not.deep.include({ name: agent.user.username });
		});

		it("should not consider system messages in agents' first response time metric", async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });
			roomId = response.room._id;

			await sleep(firstDelayInSeconds * 1000);
			await sendAgentMessage(roomId, 'first response from agent', agent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Avg_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');

			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === agent.user.username,
			);
			expect(agentData).to.not.be.undefined;
			expect(agentData).to.have.property('name', agent.user.username);
			expect(agentData).to.have.property('value');
			originalFirstResponseTimeInSeconds = moment.duration(agentData.value).asSeconds();
			expect(originalFirstResponseTimeInSeconds).to.be.greaterThanOrEqual(firstDelayInSeconds);
		});

		it("should not consider bot messages in agent's first response time metric if setting is enabled", async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: botAgent.credentials });

			roomId = response.room._id;

			await sleep(firstDelayInSeconds * 1000);

			await sendAgentMessage(roomId, 'first response from agent', botAgent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Avg_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');

			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === botAgent.user.username,
			);
			expect(agentData).to.be.undefined;
		});

		it('should correctly associate the first response time to the first agent who responded the room', async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: forwardAgent.credentials });
			roomId = response.room._id;

			await sendAgentMessage(roomId, 'first response from agent', forwardAgent.credentials);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId,
					userId: agent.user._id,
					comment: 'test comment',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			await sendAgentMessage(roomId, 'first response from forwarded agent', agent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Avg_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');

			// The agent to whom the room has been forwarded shouldn't have their average first response time changed
			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === agent.user.username,
			);
			expect(agentData).to.not.be.undefined;
			expect(agentData).to.have.property('name', agent.user.username);
			expect(agentData).to.have.property('value');
			const averageFirstResponseTimeInSeconds = moment.duration(agentData.value).asSeconds();
			expect(originalFirstResponseTimeInSeconds).to.be.equal(averageFirstResponseTimeInSeconds);

			// A room's first response time should be attached to the agent who first responded to it even if it has been forwarded
			const forwardAgentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === forwardAgent.user.username,
			);
			expect(forwardAgentData).to.not.be.undefined;
			expect(forwardAgentData).to.have.property('name', forwardAgent.user.username);
			expect(forwardAgentData).to.have.property('value');
			const forwardAgentAverageFirstResponseTimeInSeconds = moment.duration(forwardAgentData.value).asSeconds();
			expect(originalFirstResponseTimeInSeconds).to.be.greaterThan(forwardAgentAverageFirstResponseTimeInSeconds);
		});

		it('should correctly calculate the average time of first responses for an agent', async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });
			roomId = response.room._id;

			await sleep(secondDelayInSeconds * 1000);
			await sendAgentMessage(roomId, 'first response from agent', agent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Avg_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array').that.is.not.empty;

			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === agent.user.username,
			);
			expect(agentData).to.not.be.undefined;
			expect(agentData).to.have.property('name', agent.user.username);
			expect(agentData).to.have.property('value');
			const averageFirstResponseTimeInSeconds = moment.duration(agentData.value).asSeconds();
			expect(averageFirstResponseTimeInSeconds).to.be.greaterThan(originalFirstResponseTimeInSeconds);
			expect(averageFirstResponseTimeInSeconds).to.be.greaterThanOrEqual((firstDelayInSeconds + secondDelayInSeconds) / 2);
			expect(averageFirstResponseTimeInSeconds).to.be.lessThan(secondDelayInSeconds);
		});
	});

	describe('[livechat/analytics/agent-overview] - Best first response time', () => {
		let agent: { credentials: Credentials; user: IUser & { username: string } };
		let forwardAgent: { credentials: Credentials; user: IUser & { username: string } };
		let originalBestFirstResponseTimeInSeconds: number;
		let roomId: string;

		before(async () => {
			agent = await createAnOnlineAgent();
			forwardAgent = await createAnOnlineAgent();
		});

		after(() => Promise.all([deleteUser(agent.user), deleteUser(forwardAgent.user)]));

		it('should return no best response time for an agent if no response has been sent in the period', async () => {
			await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });

			const today = moment().startOf('day').format('YYYY-MM-DD');

			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Best_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');
			expect(result.body.data).to.not.deep.include({ name: agent.user.username });
		});

		it("should not consider system messages in agents' best response time metric", async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });
			roomId = response.room._id;

			const delayInSeconds = 4;
			await sleep(delayInSeconds * 1000);

			await sendAgentMessage(roomId, 'first response from agent', agent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Best_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array').that.is.not.empty;

			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === agent.user.username,
			);
			expect(agentData).to.not.be.undefined;
			expect(agentData).to.have.property('name', agent.user.username);
			expect(agentData).to.have.property('value');
			originalBestFirstResponseTimeInSeconds = moment.duration(agentData.value).asSeconds();
			expect(originalBestFirstResponseTimeInSeconds).to.be.greaterThanOrEqual(delayInSeconds);
		});

		it('should correctly calculate the best first response time for an agent and there are multiple first responses in the period', async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: agent.credentials });
			roomId = response.room._id;

			const delayInSeconds = 6;
			await sleep(delayInSeconds * 1000);

			await sendAgentMessage(roomId, 'first response from agent', agent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Best_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');

			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === agent.user.username,
			);
			expect(agentData).to.not.be.undefined;
			expect(agentData).to.have.property('name', agent.user.username);
			expect(agentData).to.have.property('value');
			const bestFirstResponseTimeInSeconds = moment.duration(agentData.value).asSeconds();
			expect(bestFirstResponseTimeInSeconds).to.be.equal(originalBestFirstResponseTimeInSeconds);
		});

		it('should correctly associate best first response time to the first agent who responded the room', async () => {
			const response = await startANewLivechatRoomAndTakeIt({ agent: forwardAgent.credentials });
			roomId = response.room._id;

			await sendAgentMessage(roomId, 'first response from agent', forwardAgent.credentials);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId,
					userId: agent.user._id,
					comment: 'test comment',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			await sendAgentMessage(roomId, 'first response from forwarded agent', agent.credentials);

			const today = moment().startOf('day').format('YYYY-MM-DD');
			const result = await request
				.get(api('livechat/analytics/agent-overview'))
				.query({ from: today, to: today, name: 'Best_first_response_time' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.have.property('success', true);
			expect(result.body).to.have.property('head');
			expect(result.body).to.have.property('data');
			expect(result.body.data).to.be.an('array');

			// The agent to whom the room has been forwarded shouldn't have their best first response time changed
			const agentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === agent.user.username,
			);
			expect(agentData).to.not.be.undefined;
			expect(agentData).to.have.property('name', agent.user.username);
			expect(agentData).to.have.property('value');
			const bestFirstResponseTimeInSeconds = moment.duration(agentData.value).asSeconds();
			expect(bestFirstResponseTimeInSeconds).to.be.equal(originalBestFirstResponseTimeInSeconds);

			// A room's first response time should be attached to the agent who first responded to it even if it has been forwarded
			const forwardAgentData = result.body.data.find(
				(agentOverviewData: { name: string; value: string }) => agentOverviewData.name === forwardAgent.user.username,
			);
			expect(forwardAgentData).to.not.be.undefined;
			expect(forwardAgentData).to.have.property('name', forwardAgent.user.username);
			expect(forwardAgentData).to.have.property('value');
			const forwardAgentBestFirstResponseTimeInSeconds = moment.duration(forwardAgentData.value).asSeconds();
			expect(forwardAgentBestFirstResponseTimeInSeconds).to.be.lessThan(originalBestFirstResponseTimeInSeconds);
		});
	});

	describe('livechat/analytics/overview', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: 'Conversations' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return an "invalid-chart-name error" when the chart name is empty', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.get(api('livechat/analytics/overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: '' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should return empty when chart name is invalid', async () => {
			await request
				.get(api('livechat/analytics/overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: 'invalid-chart-name' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(Object.keys(res.body)).to.have.lengthOf(1);
				});
		});
		it('should return an array of analytics overview data', async () => {
			const result = await request
				.get(api('livechat/analytics/overview'))
				.query({ from: '2020-01-01', to: '2020-01-02', name: 'Conversations' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.be.an('array');
			expect(result.body).to.have.lengthOf(7);
			expect(result.body[0]).to.have.property('title', 'Total_conversations');
			expect(result.body[0]).to.have.property('value', 0);
		});
		(IS_EE ? it : it.skip)('should return analytics overview data with correct values', async () => {
			const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
			const today = moment().startOf('day').format('YYYY-MM-DD');

			const result = await request
				.get(api('livechat/analytics/overview'))
				.query({ from: yesterday, to: today, name: 'Conversations', departmentId: department._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(result.body).to.be.an('array');

			const expectedResult = [
				{ title: 'Total_conversations', value: 16 },
				{ title: 'Open_conversations', value: 13 },
				{ title: 'On_Hold_conversations', value: 1 },
				// { title: 'Total_messages', value: 6 },
				// { title: 'Busiest_day', value: moment().format('dddd') },
				{ title: 'Conversations_per_day', value: '8.00' },
				// { title: 'Busiest_time', value: '' },
			];

			expectedResult.forEach((expected) => {
				const resultItem = result.body.find((item: any) => item.title === expected.title);
				expect(resultItem).to.not.be.undefined;
				expect(resultItem).to.have.property('value', expected.value);
			});

			const minMessages = TOTAL_MESSAGES.min * TOTAL_ROOMS;

			const totalMessages = result.body.find((item: any) => item.title === 'Total_messages');
			expect(totalMessages).to.not.be.undefined;
			const totalMessagesValue = parseInt(totalMessages.value);
			expect(totalMessagesValue).to.be.greaterThanOrEqual(minMessages);
		});
		(IS_EE ? it : it.skip)(
			'should only consider conversations in the provided time range when returning analytics conversations overview data',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/overview'))
					.query({ from: yesterday, to: yesterday, name: 'Conversations', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.be.an('array');

				const expectedResult = [
					{ title: 'Total_conversations', value: 0 },
					{ title: 'Open_conversations', value: 0 },
					{ title: 'On_Hold_conversations', value: 0 },
					{ title: 'Conversations_per_day', value: '0.00' },
				];

				expectedResult.forEach((expected) => {
					const resultItem = result.body.find((item: any) => item.title === expected.title);
					expect(resultItem).to.not.be.undefined;
					expect(resultItem).to.have.property('value', expected.value);
				});
			},
		);
		(IS_EE ? it : it.skip)(
			'should only consider conversations in the provided time range when returning analytics productivity overview data',
			async () => {
				const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

				const result = await request
					.get(api('livechat/analytics/overview'))
					.query({ from: yesterday, to: yesterday, name: 'Productivity', departmentId: department._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(result.body).to.be.an('array');

				const expectedResult = [
					{ title: 'Avg_response_time', value: '00:00:00' },
					{ title: 'Avg_first_response_time', value: '00:00:00' },
					{ title: 'Avg_reaction_time', value: '00:00:00' },
				];

				expectedResult.forEach((expected) => {
					const resultItem = result.body.find((item: any) => item.title === expected.title);
					expect(resultItem).to.not.be.undefined;
					expect(resultItem).to.have.property('value', expected.value);
				});
			},
		);
	});
});
