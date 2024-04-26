import { faker } from '@faker-js/faker';
import { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelCurrentChats } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createConversation, updateRoom } from '../utils/omnichannel/rooms';
import { createTag } from '../utils/omnichannel/tags';
import { test, expect } from '../utils/test';

const visitorA = faker.person.firstName();
const visitorB = faker.person.firstName();
const visitorC = faker.person.firstName();

test.skip(!IS_EE, 'OC - Current Chats > Enterprise Only');

test.use({ storageState: Users.admin.state });

test.describe('OC - Current Chats [Auto Selection]', async () => {
	let poCurrentChats: OmnichannelCurrentChats;
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];

	// Allow manual on hold
	test.beforeAll(async ({ api }) => {
		const responses = await Promise.all([
			api.post('/settings/Livechat_allow_manual_on_hold', { value: true }),
			api.post('/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only', { value: false }),
		]);
		responses.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create departments
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api)]);
	});

	// Create agents
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2')]);

		const agentsStatuses = await Promise.all(agents.map(({ data: agent }) => makeAgentAvailable(api, agent._id)));

		agentsStatuses.forEach((res) => expect(res.status()).toBe(200));
	});

	// Add agents to departments
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		const promises = await Promise.all([
			addAgentToDepartment(api, { department: departmentA, agentId: 'user1' }),
			addAgentToDepartment(api, { department: departmentB, agentId: 'user2' }),
		]);

		promises.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create tags
	test.beforeAll(async ({ api }) => {
		const promises = await Promise.all([createTag(api, 'tagA'), createTag(api, 'tagB')]);

		promises.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create rooms
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		conversations = await Promise.all([
			createConversation(api, {
				visitorName: visitorA,
				visitorToken: visitorA,
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				visitorName: visitorB,
				visitorToken: visitorB,
				agentId: `user2`,
				departmentId: departmentB._id,
			}),
			createConversation(api, {
				visitorName: visitorC,
				visitorToken: visitorC,
			}),
		]);

		const [conversationA, conversationB] = conversations.map(({ data }) => data);

		await Promise.all([
			updateRoom(api, {
				roomId: conversationA.room._id,
				visitorId: conversationA.visitor._id,
				tags: ['tagA'],
			}),
			updateRoom(api, {
				roomId: conversationB.room._id,
				visitorId: conversationB.visitor._id,
				tags: ['tagB'],
			}),
		]);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poCurrentChats = new OmnichannelCurrentChats(page);

		await page.goto('/omnichannel');
		await poCurrentChats.sidenav.linkCurrentChats.click();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			// Delete conversations
			...conversations.map((conversation) => conversation.delete()),
			// // Delete departments
			...departments.map((department) => department.delete()),
			// Delete agents
			...agents.map((agent) => agent.delete()),
			// Reset setting
			api.post('/settings/Livechat_allow_manual_on_hold', { value: false }),
			api.post('/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only', { value: true }),
			// TODO: remove tags
		]);
	});

	// Change conversation A to on hold and close conversation B
	test.beforeAll(async ({ api }) => {
		const [conversationA, , conversationC] = conversations.map(({ data }) => data);

		const statesPromises = await Promise.all([
			api.post('/livechat/room.onHold', { roomId: conversationA.room._id }),
			api.post('/livechat/room.close', { rid: conversationC.room._id, token: visitorC }),
		]);

		statesPromises.forEach((res) => expect(res.status()).toBe(200));
	});

	test.skip('OC - Current chats - Accessibility violations', async ({ makeAxeBuilder }) => {
		const results = await makeAxeBuilder().analyze();
		expect(results.violations).toEqual([]);
	});

	test('OC - Current chats - Filters', async () => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		await test.step('expect to filter by guest', async () => {
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();

			await poCurrentChats.inputGuest.fill(visitorA);
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).not.toBeVisible();

			await poCurrentChats.inputGuest.fill('');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter by server', async () => {
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();

			await poCurrentChats.selectServedBy('user1');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).not.toBeVisible();

			await poCurrentChats.selectServedBy('user2');
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorA)).not.toBeVisible();

			await poCurrentChats.selectServedBy('all');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter by status', async () => {
			await poCurrentChats.selectStatus('closed');
			await expect(poCurrentChats.findRowByName(visitorA)).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).toBeVisible();

			await poCurrentChats.selectStatus('opened');
			await expect(poCurrentChats.findRowByName(visitorA)).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).not.toBeVisible();

			await poCurrentChats.selectStatus('onhold');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).not.toBeVisible();

			await poCurrentChats.selectStatus('all');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).toBeVisible();
		});

		await test.step('expect to filter by department', async () => {
			await poCurrentChats.selectDepartment(departmentA.name);
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).not.toBeVisible();

			await poCurrentChats.selectDepartment(departmentB.name);
			await expect(poCurrentChats.findRowByName(visitorA)).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).not.toBeVisible();

			await poCurrentChats.selectDepartment('All');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).toBeVisible();
		});

		await test.step('expect to filter by tags', async () => {
			await poCurrentChats.addTag('tagA');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).not.toBeVisible();

			await poCurrentChats.addTag('tagB');
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();

			await poCurrentChats.removeTag('tagA');
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorA)).not.toBeVisible();

			await poCurrentChats.removeTag('tagB');
			await expect(poCurrentChats.findRowByName(visitorB)).toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorA)).toBeVisible();
		});

		// TODO: Unit test await test.step('expect to filter by period', async () => {});

		// TODO: Unit test await test.step('expect to filter by custom fields', async () => {});

		// TODO: Unit test await test.step('expect to filter clear all', async () => {});
	});

	test('OC - Current chats - Basic navigation', async ({ page }) => {
		await test.step('expect to be return using return button', async () => {
			const { room: roomA } = conversations[0].data;
			await poCurrentChats.findRowByName(visitorA).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomA._id}`);
			await poCurrentChats.content.btnReturn.click();
			await expect(page).toHaveURL(`/omnichannel/current`);
		});
	});

	test('OC - Current chats - Access in progress conversation from another agent', async ({ page }) => {
		await test.step('expect to be able to join', async () => {
			const { room: roomB, visitor: visitorB } = conversations[1].data;
			await poCurrentChats.findRowByName(visitorB.name).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomB._id}`);
			await expect(poCurrentChats.content.btnJoinRoom).toBeVisible();
			await poCurrentChats.content.btnJoinRoom.click();
			await expect(poCurrentChats.content.btnJoinRoom).not.toBeVisible();
		});
	});

	test('OC - Current chats - Remove conversations', async () => {
		await test.step('expect to be able to remove conversation from table', async () => {
			await poCurrentChats.btnRemoveByName(visitorC).click();
			await expect(poCurrentChats.modalConfirmRemove).toBeVisible();
			await poCurrentChats.btnConfirmRemove.click();
			await expect(poCurrentChats.modalConfirmRemove).not.toBeVisible();
			await expect(poCurrentChats.findRowByName(visitorC)).not.toBeVisible();
		});

		// TODO: await test.step('expect to be able to close all closes conversations', async () => {});
	});
});

test.describe('OC - Current Chats [Manual Selection]', () => {
	let queuedConversation: Awaited<ReturnType<typeof createConversation>>;
	let poCurrentChats: OmnichannelCurrentChats;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ api }) => {
		const res = await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' });
		expect(res.status()).toBe(200);
	});

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'rocketchat.internal.admin.test');

		const agentStatus = await makeAgentAvailable(api, agent.data._id);

		expect(agentStatus.status()).toBe(200);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poCurrentChats = new OmnichannelCurrentChats(page);

		await page.goto('/omnichannel');
		await poCurrentChats.sidenav.linkCurrentChats.click();
	});

	test('OC - Current chats - Access queued conversation', async ({ page, api }) => {
		queuedConversation = await createConversation(api, { visitorToken: 'visitorQueued' });

		await test.step('expect to be able to take it', async () => {
			const { room, visitor } = queuedConversation.data;
			await poCurrentChats.inputGuest.fill(visitor.name);
			await poCurrentChats.findRowByName(visitor.name).click();
			await expect(page).toHaveURL(`/omnichannel/current/${room._id}`);
			await expect(poCurrentChats.content.btnTakeChat).toBeVisible();
			await poCurrentChats.content.btnTakeChat.click();
			await expect(poCurrentChats.content.btnTakeChat).not.toBeVisible();
		});
	});

	test.afterAll(async ({ api }) => {
		const res = await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' });
		expect(res.status()).toBe(200);
	});

	test.afterAll(async () => {
		await queuedConversation.delete();
		await agent.delete();
	});
});
