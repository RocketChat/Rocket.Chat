import { faker } from '@faker-js/faker';
import { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createManager } from '../utils/omnichannel/managers';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const MANAGER = 'user3';
const ROOM_A = faker.person.fullName();
const ROOM_B = faker.person.fullName();
const ROOM_C = faker.person.fullName();

test.use({ storageState: Users.user3.state });

test.describe('OC - Manager Role', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let poOmnichannel: HomeOmnichannel;

	let manager: Awaited<ReturnType<typeof createManager>>;

	// Allow manual on hold
	test.beforeAll(async ({ api }) => {
		const responses = await Promise.all([
			api.post('/settings/Livechat_allow_manual_on_hold', { value: true }),
			api.post('/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only', { value: false }),
		]);
		responses.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create agents
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2'), createAgent(api, MANAGER)]);

		const agentsStatuses = await Promise.all(agents.slice(0, 2).map(({ data: agent }) => makeAgentAvailable(api, agent._id)));

		agentsStatuses.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create departments
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api)]);
	});

	// Create manager
	test.beforeAll(async ({ api }) => {
		manager = await createManager(api, MANAGER);
	});

	// Create conversations
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		conversations = await Promise.all([
			createConversation(api, {
				visitorName: ROOM_A,
				visitorToken: 'roomA',
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				visitorName: ROOM_B,
				visitorToken: 'roomB',
				agentId: `user2`,
				departmentId: departmentB._id,
			}),
			createConversation(api, {
				visitorName: ROOM_C,
				visitorToken: 'roomC',
				agentId: `user2`,
			}),
		]);
	});

	// Delete all created data
	test.afterAll(async ({ api }) => {
		await Promise.all([
			...agents.map((agent) => agent.delete()),
			...departments.map((department) => department.delete()),
			...conversations.map((conversation) => conversation.delete()),
			manager.delete(),
			// Reset setting
			api.post('/settings/Livechat_allow_manual_on_hold', { value: false }),
			api.post('/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only', { value: true }),
		]);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannel = new HomeOmnichannel(page);

		await page.goto('/omnichannel');
	});

	test('OC - Manager Role - Basic permissions', async () => {
		await test.step('expect agent to not have access to omnichannel administration', async () => {
			await expect(poOmnichannel.omnisidenav.linkCurrentChats).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkAnalytics).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkRealTimeMonitoring).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkAgents).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkDepartments).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkBusinessHours).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkReports).toBeVisible();
			await expect(poOmnichannel.omnisidenav.linkCannedResponses).toBeVisible();
		});
	});

	test('OC - Manager Role - Current Chats', async ({ page }) => {
		const [conversationA] = conversations;
		const { room: roomA } = conversationA.data;

		await test.step('expect to be able to view all chats', async () => {
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_A)).toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_B)).toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_C)).toBeVisible();
		});

		await test.step('expect to be able to join chats', async () => {
			await poOmnichannel.currentChats.findRowByName(ROOM_A).click();
			await expect(page).toHaveURL(`/omnichannel/current/${roomA._id}`);
			await expect(poOmnichannel.content.btnJoinRoom).toBeVisible();
			await expect(poOmnichannel.content.inputMessage).not.toBeVisible();

			await poOmnichannel.content.btnJoinRoom.click();
			await expect(poOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
			await expect(poOmnichannel.content.btnJoinRoom).not.toBeVisible();
			await expect(poOmnichannel.content.inputMessage).toBeVisible();
		});

		await test.step('expect to be able to put a conversation from another agent on hold', async () => {
			await poOmnichannel.content.btnOnHold.click({ clickCount: 2 });
			await expect(poOmnichannel.content.modalOnHold).toBeVisible();
			await poOmnichannel.content.btnOnHoldConfirm.click();
			await expect(poOmnichannel.content.lastSystemMessageBody).toHaveText(
				`Chat On Hold: The chat was manually placed On Hold by ${MANAGER}`,
			);
			await expect(poOmnichannel.content.inputMessage).not.toBeVisible();
			await expect(poOmnichannel.content.btnResume).toBeVisible();
		});

		await test.step('expect to be able resume a conversation from another agent on hold', async () => {
			await poOmnichannel.content.btnResume.click();
			await expect(poOmnichannel.content.btnResume).not.toBeVisible();
			await expect(poOmnichannel.content.inputMessage).toBeVisible();
			await expect(poOmnichannel.content.btnOnHold).toBeVisible();
		});

		await test.step('expect to be able to close a conversation from another agent', async () => {
			await poOmnichannel.content.btnCloseChat.click();
			await poOmnichannel.content.inputModalClosingComment.type('any_comment');
			await poOmnichannel.content.btnModalConfirm.click();
			await expect(poOmnichannel.toastSuccess).toBeVisible();
			await page.waitForURL('/omnichannel/current');
		});

		await test.step('expect to be able to remove closed rooms', async () => {
			await poOmnichannel.currentChats.btnRemoveByName(ROOM_A).click();
			await expect(poOmnichannel.currentChats.modalConfirmRemove).toBeVisible();
			await poOmnichannel.currentChats.btnConfirmRemove.click();
			await expect(poOmnichannel.currentChats.modalConfirmRemove).not.toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_A)).not.toBeVisible();
		});
	});

	test('OC - Manager Role - Add/remove agents', async () => {
		await poOmnichannel.agents.sidenav.linkAgents.click();

		await test.step('expect add "user1" as agent', async () => {
			await poOmnichannel.agents.selectUsername('user1');
			await poOmnichannel.agents.btnAdd.click();

			await poOmnichannel.agents.inputSearch.fill('user1');
			await expect(poOmnichannel.agents.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect remove "user1" as agent', async () => {
			await poOmnichannel.agents.inputSearch.fill('user1');
			await poOmnichannel.agents.btnDeleteFirstRowInTable.click();
			await poOmnichannel.agents.btnModalRemove.click();

			await poOmnichannel.agents.inputSearch.fill('');
			await poOmnichannel.agents.inputSearch.fill('user1');
			await expect(poOmnichannel.agents.findRowByName('user1')).toBeHidden();
		});
	});

	test('OC - Manager Role - Add/remove managers', async () => {
		await poOmnichannel.omnisidenav.linkManagers.click();

		await test.step('expect add "user1" as manager', async () => {
			await poOmnichannel.managers.selectUsername('user1');
			await poOmnichannel.managers.btnAdd.click();

			await expect(poOmnichannel.managers.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect search for manager', async () => {
			await poOmnichannel.managers.search('user1');
			await expect(poOmnichannel.managers.findRowByName('user1')).toBeVisible();

			await poOmnichannel.managers.search('NonExistingUser');
			await expect(poOmnichannel.managers.findRowByName('user1')).toBeHidden();

			await poOmnichannel.managers.clearSearch();
		});

		await test.step('expect remove "user1" as manager', async () => {
			await poOmnichannel.managers.search('user1');
			await poOmnichannel.managers.btnDeleteSelectedAgent('user1').click();
			await poOmnichannel.managers.btnModalRemove.click();

			await expect(poOmnichannel.managers.findRowByName('user1')).toBeHidden();
		});
	});

	test('OC - Manager Role - Add/remove monitors', async () => {
		await poOmnichannel.omnisidenav.linkMonitors.click();

		await test.step('expect to add agent as monitor', async () => {
			await expect(poOmnichannel.monitors.findRowByName('user1')).not.toBeVisible();
			await poOmnichannel.monitors.selectMonitor('user1');
			await poOmnichannel.monitors.btnAddMonitor.click();
			await expect(poOmnichannel.monitors.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect to remove agent from monitor', async () => {
			await poOmnichannel.monitors.btnRemoveByName('user1').click();
			await expect(poOmnichannel.monitors.modalConfirmRemove).toBeVisible();
			await poOmnichannel.monitors.btnConfirmRemove.click();
			await expect(poOmnichannel.monitors.findRowByName('user1')).not.toBeVisible();
		});
	});

	test('OC - Manager Role - Permission revoked', async ({ page }) => {
		await poOmnichannel.omnisidenav.linkCurrentChats.click();

		await test.step('expect not to be able to see current chats once role is removed', async () => {
			const res = await manager.delete();
			await expect(res.status()).toBe(200);
			await page.reload();
			await expect(page.locator('p >> text="You are not authorized to view this page."')).toBeVisible();
		});
	});
});
