import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelChats } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createConversation, updateRoom } from '../utils/omnichannel/rooms';
import { createTag } from '../utils/omnichannel/tags';
import { test, expect } from '../utils/test';

const visitorA = faker.person.firstName();
const visitorB = faker.person.firstName();
const visitorC = faker.person.firstName();

test.skip(!IS_EE, 'OC - Contact Center Chats > Enterprise Only');

test.use({ storageState: Users.admin.state });

test.describe('OC - Contact Center Chats [Auto Selection]', async () => {
	let poOmnichats: OmnichannelChats;
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let tagA: Awaited<ReturnType<typeof createTag>>;
	let tagB: Awaited<ReturnType<typeof createTag>>;

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
		tagA = await createTag(api);
		tagB = await createTag(api);

		[tagA, tagB].forEach((res) => expect(res.response.status()).toBe(200));
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
				tags: [tagA.data.name],
			}),
			updateRoom(api, {
				roomId: conversationB.room._id,
				visitorId: conversationB.visitor._id,
				tags: [tagB.data.name],
			}),
		]);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichats = new OmnichannelChats(page);

		await page.goto('/omnichannel');
		await poOmnichats.sidenav.linkCurrentChats.click();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			// Delete conversations
			...conversations.map((conversation) => conversation.delete()),
			// Delete departments
			...departments.map((department) => department.delete()),
			// Delete agents
			...agents.map((agent) => agent.delete()),
			// Delete tags
			...[tagA, tagB].map((tag) => tag.delete()),
			// Reset setting
			api.post('/settings/Livechat_allow_manual_on_hold', { value: false }),
			api.post('/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only', { value: true }),
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

	test('OC - Contact Center Chats - Basic navigation', async ({ page }) => {
		await test.step('expect to be return using return button', async () => {
			await poOmnichats.openChat(visitorA);
			await poOmnichats.content.btnReturn.click();
			expect(page.url()).toContain(`/omnichannel/current`);
		});
	});

	test('OC - Contact Center Chats - Access in progress conversation from another agent', async () => {
		await test.step('expect to be able to join', async () => {
			const { visitor: visitorB } = conversations[1].data;
			await poOmnichats.openChat(visitorB.name);
			await expect(poOmnichats.content.btnJoinRoom).toBeVisible();
			await poOmnichats.content.btnJoinRoom.click();
			await expect(poOmnichats.content.btnJoinRoom).not.toBeVisible();
		});
	});

	test('OC - Contact Center Chats - Remove conversations', async () => {
		await test.step('expect to be able to remove conversation from table', async () => {
			await poOmnichats.removeChatByName(visitorC);
			await expect(poOmnichats.findRowByName(visitorC)).not.toBeVisible();
		});

		// TODO: await test.step('expect to be able to close all closes conversations', async () => {});
	});
});

test.describe('OC - Contact Center [Manual Selection]', () => {
	let queuedConversation: Awaited<ReturnType<typeof createConversation>>;
	let poCurrentChats: OmnichannelChats;
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
		poCurrentChats = new OmnichannelChats(page);

		await page.goto('/omnichannel');
		await poCurrentChats.sidenav.linkCurrentChats.click();
	});

	test('OC - Contact Center Chats - Access queued conversation', async ({ api }) => {
		queuedConversation = await createConversation(api, { visitorToken: 'visitorQueued' });

		await test.step('expect to be able to take it', async () => {
			const { visitor } = queuedConversation.data;
			await poCurrentChats.inputSearch.fill(visitor.name);
			await poCurrentChats.openChat(visitor.name);
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
