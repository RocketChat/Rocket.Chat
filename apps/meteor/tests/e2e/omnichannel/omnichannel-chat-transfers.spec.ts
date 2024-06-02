import { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createManager } from '../utils/omnichannel/managers';
import { createMonitor } from '../utils/omnichannel/monitors';
import { createConversation } from '../utils/omnichannel/rooms';
import { createOrUpdateUnit } from '../utils/omnichannel/units';
import { expect, test } from '../utils/test';

const wrapSession = async ({ page }: { page: Page }) => ({ page, poHomeOmnichannel: new HomeOmnichannel(page) });

test.use({ storageState: Users.user3.state });

test.skip(!IS_EE, 'Enterprise Edition Only');

test.describe('OC - Chat transfers [Monitor role]', () => {
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let monitors: Awaited<ReturnType<typeof createMonitor>>[];
	let units: Awaited<ReturnType<typeof createOrUpdateUnit>>[];
	let sessions: { page: Page; poHomeOmnichannel: HomeOmnichannel }[];

	let poOmnichannel: HomeOmnichannel;

	// Create agents
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2'), createAgent(api, 'rocketchat.internal.admin.test')]);

		(await Promise.all(agents.map(({ data: agent }) => makeAgentAvailable(api, agent._id)))).forEach((res) => {
			expect(res.status()).toBe(200);
		});
	});

	// Create departments
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api)]);
	});

	// Add agents to departments
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		const promises = await Promise.all([
			addAgentToDepartment(api, { department: departmentA, agentId: 'user1' }),
			addAgentToDepartment(api, { department: departmentA, agentId: 'rocketchat.internal.admin.test' }),
			addAgentToDepartment(api, { department: departmentB, agentId: 'user2' }),
		]);

		promises.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create conversations
	test.beforeAll(async ({ api }) => {
		const [departmentA] = departments.map(({ data }) => data);

		conversations = await Promise.all([
			createConversation(api, {
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
		]);
	});

	// Create monitors
	test.beforeAll(async ({ api }) => {
		monitors = await Promise.all([createMonitor(api, 'user3')]);
	});

	// Create units
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		units = await Promise.all([
			createOrUpdateUnit(api, {
				monitors: [{ monitorId: 'user3', username: 'user3' }],
				departments: [{ departmentId: departmentA._id }],
			}),
			createOrUpdateUnit(api, {
				monitors: [{ monitorId: 'rocketchat.internal.admin.test', username: 'rocketchat.internal.admin.test' }],
				departments: [{ departmentId: departmentB._id }],
			}),
		]);
	});

	// Create sessions
	test.beforeEach(async ({ browser }) => {
		sessions = await Promise.all([
			createAuxContext(browser, Users.user1).then(wrapSession),
			createAuxContext(browser, Users.user2).then(wrapSession),
			createAuxContext(browser, Users.admin).then(wrapSession),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannel = new HomeOmnichannel(page);

		await page.goto('/omnichannel/current');
	});

	// Close sessions
	test.afterEach(async () => {
		await Promise.all(sessions.map(({ page }) => page.close()));
	});

	test.afterAll(async () => {
		await Promise.all([
			...conversations.map((conversation) => conversation.delete()),
			...monitors.map((monitor) => monitor.delete()),
			...agents.map((agent) => agent.delete()),
			...units.map((unit) => unit.delete()),
			...departments.map((department) => department.delete()),
		]);
	});

	test(`OC - Chat transfers [Monitor role] - Transfer to another department`, async ({ page }) => {
		const [, departmentB] = departments.map(({ data }) => data);
		const [roomA] = conversations.map(({ data }) => data.room);
		const [agentA, agentB] = sessions;

		await test.step('expect room a to bot be visible for user2', async () => {
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
			await poOmnichannel.currentChats.findRowByName(roomA.fname).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomA._id}`);
			await poOmnichannel.content.btnForwardChat.click();
		});

		await test.step('expect agent and department fields to be visible and enabled', async () => {
			await expect(poOmnichannel.content.forwardChatModal.inputFowardUser).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.inputFowardDepartment).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeDisabled();
		});

		await test.step('expect to transfer from dep a to dep b', async () => {
			await poOmnichannel.content.forwardChatModal.selectDepartment(departmentB.name);
			await poOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeEnabled();
			await poOmnichannel.content.forwardChatModal.btnForward.click();
			// await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect conversation to have been assigned to user 2', async () => {
			await expect(agentA.page).toHaveURL(`/home`);
			await expect(agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname)).not.toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname)).toBeVisible();
		});

		await test.step('expect user 1 to have left the conversation', async () => {
			await agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname).click();
			await agentB.poHomeOmnichannel.content.findSystemMessage(
				`Transfer: user3 transferred the chat to the department ${departmentB.name}}`,
			);
			await agentB.poHomeOmnichannel.content.findSystemMessage('left the channel');
		});
	});

	test(`OC - Chat transfers [Monitor role] - Transfer to another agent, different department`, async ({ page }) => {
		const [, roomB] = conversations.map(({ data }) => data.room);
		const [agentA, agentB] = sessions;

		await test.step('expect room a to bot be visible for user2', async () => {
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
			await poOmnichannel.currentChats.findRowByName(roomB.fname).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomB._id}`);
			await poOmnichannel.content.btnForwardChat.click();
		});

		await test.step('expect agent and department fields to be visible and enabled', async () => {
			await expect(poOmnichannel.content.forwardChatModal.inputFowardUser).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.inputFowardDepartment).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeDisabled();
		});

		await test.step('expect to transfer from user1 to user2', async () => {
			await poOmnichannel.content.forwardChatModal.selectUser(`user2`);
			await poOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeEnabled();
			await poOmnichannel.content.forwardChatModal.btnForward.click();
			// await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect conversation to have been assigned to user 2', async () => {
			await expect(agentA.page).toHaveURL(`/home`);
			await expect(agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname)).not.toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname)).toBeVisible();
		});

		await test.step('expect user 1 to have left the conversation', async () => {
			await agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname).click();
			await expect(
				agentB.poHomeOmnichannel.content.findSystemMessage(
					`New Chat Transfer: user3 transferred the chat to user2 with a comment: any_comment`,
				),
			).toBeVisible();
			await expect(agentB.poHomeOmnichannel.content.findSystemMessage('left the channel')).toBeVisible();
		});
	});

	test(`OC - Chat transfers [Monitor role] - Transfer to another agent, same department`, async ({ page }) => {
		const [, , roomC] = conversations.map(({ data }) => data.room);
		const [agentA, , agentC] = sessions;

		await test.step('expect room a to bot be visible for user2', async () => {
			await expect(agentC.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
			await poOmnichannel.currentChats.findRowByName(roomC.fname).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomC._id}`);
			await poOmnichannel.content.btnForwardChat.click();
		});

		await test.step('expect agent and department fields to be visible and enabled', async () => {
			await expect(poOmnichannel.content.forwardChatModal.inputFowardUser).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.inputFowardDepartment).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeDisabled();
		});

		await test.step('expect to transfer from dep a to dep b', async () => {
			await poOmnichannel.content.forwardChatModal.selectUser('rocketchat.internal.admin.test');
			await poOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeEnabled();
			await poOmnichannel.content.forwardChatModal.btnForward.click();
			// await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect conversation to have been assigned to user 2', async () => {
			await expect(agentA.page).toHaveURL(`/home`);
			await expect(agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname)).not.toBeVisible();
			await expect(agentC.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname)).toBeVisible();
		});

		await test.step('expect user 1 to have left the conversation', async () => {
			await agentC.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname).click();
			await expect(
				agentC.poHomeOmnichannel.content.findSystemMessage(
					`New Chat Transfer: user3 transferred the chat to RocketChat Internal Admin Test with a comment: any_comment`,
				),
			).toBeVisible();
			await expect(agentC.poHomeOmnichannel.content.findSystemMessage('left the channel')).toBeVisible();
		});
	});
});

test.describe('OC - Chat transfers [Manager role]', () => {
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let managers: Awaited<ReturnType<typeof createManager>>[];
	let sessions: { page: Page; poHomeOmnichannel: HomeOmnichannel }[];

	let poOmnichannel: HomeOmnichannel;

	// Create agents
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2'), createAgent(api, 'rocketchat.internal.admin.test')]);

		(await Promise.all(agents.map(({ data: agent }) => makeAgentAvailable(api, agent._id)))).forEach((res) => {
			expect(res.status()).toBe(200);
		});
	});

	// Create managers
	test.beforeAll(async ({ api }) => {
		managers = await Promise.all([createManager(api, 'user3')]);
	});

	// Create departments
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api)]);
	});

	// Add agents to departments
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		const promises = await Promise.all([
			addAgentToDepartment(api, { department: departmentA, agentId: 'user1' }),
			addAgentToDepartment(api, { department: departmentA, agentId: 'rocketchat.internal.admin.test' }),
			addAgentToDepartment(api, { department: departmentB, agentId: 'user2' }),
		]);

		promises.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create conversations
	test.beforeAll(async ({ api }) => {
		const [departmentA] = departments.map(({ data }) => data);

		conversations = await Promise.all([
			createConversation(api, {
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
		]);
	});

	// Create sessions
	test.beforeEach(async ({ browser }) => {
		sessions = await Promise.all([
			createAuxContext(browser, Users.user1).then(wrapSession),
			createAuxContext(browser, Users.user2).then(wrapSession),
			createAuxContext(browser, Users.admin).then(wrapSession),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannel = new HomeOmnichannel(page);

		await page.goto('/omnichannel/current');
	});

	// Close sessions
	test.afterEach(async () => {
		await Promise.all(sessions.map(({ page }) => page.close()));
	});

	test.afterAll(async () => {
		await Promise.all([
			...conversations.map((conversation) => conversation.delete()),
			...managers.map((manager) => manager.delete()),
			...agents.map((agent) => agent.delete()),
			...departments.map((department) => department.delete()),
		]);
	});

	test(`OC - Chat transfers [Manager role] - Transfer to another department`, async ({ page }) => {
		const [, departmentB] = departments.map(({ data }) => data);
		const [roomA] = conversations.map(({ data }) => data.room);
		const [agentA, agentB] = sessions;

		await test.step('expect room a to bot be visible for user2', async () => {
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
			await poOmnichannel.currentChats.findRowByName(roomA.fname).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomA._id}`);
			await poOmnichannel.content.btnForwardChat.click();
		});

		await test.step('expect agent and department fields to be visible and enabled', async () => {
			await expect(poOmnichannel.content.forwardChatModal.inputFowardUser).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.inputFowardDepartment).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeDisabled();
		});

		await test.step('expect to transfer from dep a to dep b', async () => {
			await poOmnichannel.content.forwardChatModal.selectDepartment(departmentB.name);
			await poOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeEnabled();
			await poOmnichannel.content.forwardChatModal.btnForward.click();
			// await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect conversation to have been assigned to user 2', async () => {
			await expect(agentA.page).toHaveURL(`/home`);
			await expect(agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname)).not.toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname)).toBeVisible();
		});

		await test.step('expect user 1 to have left the conversation', async () => {
			await agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomA.fname).click();
			await agentB.poHomeOmnichannel.content.findSystemMessage(
				`Transfer: user3 transferred the chat to the department ${departmentB.name}}`,
			);
			await agentB.poHomeOmnichannel.content.findSystemMessage('left the channel');
		});
	});

	test(`OC - Chat transfers [Manager role] - Transfer to another agent, different department`, async ({ page }) => {
		const [, roomB] = conversations.map(({ data }) => data.room);
		const [agentA, agentB] = sessions;

		await test.step('expect room a to bot be visible for user2', async () => {
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
			await poOmnichannel.currentChats.findRowByName(roomB.fname).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomB._id}`);
			await poOmnichannel.content.btnForwardChat.click();
		});

		await test.step('expect agent and department fields to be visible and enabled', async () => {
			await expect(poOmnichannel.content.forwardChatModal.inputFowardUser).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.inputFowardDepartment).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeDisabled();
		});

		await test.step('expect to transfer from user1 to user2', async () => {
			await poOmnichannel.content.forwardChatModal.selectUser(`user2`);
			await poOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeEnabled();
			await poOmnichannel.content.forwardChatModal.btnForward.click();
			// await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect conversation to have been assigned to user 2', async () => {
			await expect(agentA.page).toHaveURL(`/home`);
			await expect(agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname)).not.toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname)).toBeVisible();
		});

		await test.step('expect user 1 to have left the conversation', async () => {
			await agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(roomB.fname).click();
			await expect(
				agentB.poHomeOmnichannel.content.findSystemMessage(
					`New Chat Transfer: user3 transferred the chat to user2 with a comment: any_comment`,
				),
			).toBeVisible();
			await expect(agentB.poHomeOmnichannel.content.findSystemMessage('left the channel')).toBeVisible();
		});
	});

	test(`OC - Chat transfers [Manager role] - Transfer to another agent, same department`, async ({ page }) => {
		const [, , roomC] = conversations.map(({ data }) => data.room);
		const [agentA, , agentC] = sessions;

		await test.step('expect room a to bot be visible for user2', async () => {
			await expect(agentC.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
			await poOmnichannel.currentChats.findRowByName(roomC.fname).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomC._id}`);
			await poOmnichannel.content.btnForwardChat.click();
		});

		await test.step('expect agent and department fields to be visible and enabled', async () => {
			await expect(poOmnichannel.content.forwardChatModal.inputFowardUser).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.inputFowardDepartment).toBeEnabled();
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeDisabled();
		});

		await test.step('expect to transfer from dep a to dep b', async () => {
			await poOmnichannel.content.forwardChatModal.selectUser('rocketchat.internal.admin.test');
			await poOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await expect(poOmnichannel.content.forwardChatModal.btnForward).toBeEnabled();
			await poOmnichannel.content.forwardChatModal.btnForward.click();
			// await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect conversation to have been assigned to user 2', async () => {
			await expect(agentA.page).toHaveURL(`/home`);
			await expect(agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname)).not.toBeVisible();
			await expect(agentC.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname)).toBeVisible();
		});

		await test.step('expect user 1 to have left the conversation', async () => {
			await agentC.poHomeOmnichannel.sidenav.getSidebarItemByName(roomC.fname).click();
			await expect(
				agentC.poHomeOmnichannel.content.findSystemMessage(
					`New Chat Transfer: user3 transferred the chat to RocketChat Internal Admin Test with a comment: any_comment`,
				),
			).toBeVisible();
			await expect(agentC.poHomeOmnichannel.content.findSystemMessage('left the channel')).toBeVisible();
		});
	});
});
