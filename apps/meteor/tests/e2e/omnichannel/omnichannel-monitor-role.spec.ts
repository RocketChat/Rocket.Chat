import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createMonitor } from '../utils/omnichannel/monitors';
import { createConversation } from '../utils/omnichannel/rooms';
import { createOrUpdateUnit, fetchUnitMonitors } from '../utils/omnichannel/units';
import { test, expect } from '../utils/test';

const MONITOR = 'user3';
const MONITOR_ADMIN = 'rocketchat.internal.admin.test';
const ROOM_A = faker.person.fullName();
const ROOM_B = faker.person.fullName();
const ROOM_C = faker.person.fullName();
const ROOM_D = faker.person.fullName();

test.use({ storageState: Users.user3.state });

test.describe('OC - Monitor Role', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let monitors: Awaited<ReturnType<typeof createMonitor>>[];
	let units: Awaited<ReturnType<typeof createOrUpdateUnit>>[];
	let poOmnichannel: HomeOmnichannel;

	// Reset user3 roles
	test.beforeAll(async ({ api }) => {
		const res = await api.post('/users.update', {
			data: { roles: ['user'] },
			userId: 'user3',
		});
		await expect(res.status()).toBe(200);
	});

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
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2')]);

		const agentsStatuses = await Promise.all(agents.map(({ data: agent }) => makeAgentAvailable(api, agent._id)));

		agentsStatuses.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create departments
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api), createDepartment(api)]);
	});

	// Create conversations
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		conversations = await Promise.all([
			createConversation(api, {
				visitorName: ROOM_A,
				agentId: `user1`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				visitorName: ROOM_B,
				agentId: `user2`,
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				visitorName: ROOM_C,
				agentId: `user2`,
				departmentId: departmentB._id,
			}),
			createConversation(api, {
				visitorName: ROOM_D,
			}),
		]);
	});

	// Create monitors
	test.beforeAll(async ({ api }) => {
		monitors = await Promise.all([createMonitor(api, MONITOR), createMonitor(api, MONITOR_ADMIN)]);
	});

	// Create units
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB, departmentC] = departments.map(({ data }) => data);

		units = await Promise.all([
			createOrUpdateUnit(api, {
				monitors: [{ monitorId: MONITOR, username: MONITOR }],
				departments: [{ departmentId: departmentA._id }, { departmentId: departmentB._id }],
			}),
			createOrUpdateUnit(api, {
				monitors: [{ monitorId: MONITOR_ADMIN, username: MONITOR_ADMIN }],
				departments: [{ departmentId: departmentC._id }],
			}),
		]);
	});

	// Delete all created data
	test.afterAll(async ({ api }) => {
		await Promise.all([
			...agents.map((agent) => agent.delete()),
			...departments.map((department) => department.delete()),
			...conversations.map((conversation) => conversation.delete()),
			...units.map((unit) => unit.delete()),
			...monitors.map((monitor) => monitor.delete()),
			// Reset setting
			api.post('/settings/Livechat_allow_manual_on_hold', { value: false }),
			api.post('/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only', { value: true }),
		]);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannel = new HomeOmnichannel(page);

		await page.goto('/omnichannel');
	});

	test('OC - Monitor Role - Basic permissions', async () => {
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

		// await test.step('expect to be able to see contact center', async () => {});

		// await test.step('expect to be able to see queue', async () => {});

		// await test.step('expect to be able to edit custom fields', async () => {});
	});

	test('OC - Monitor Role - Canned responses', async () => {
		// TODO: move to unit test
		await test.step('expect not to be able to create public canned responses (administration)', async () => {
			await poOmnichannel.omnisidenav.linkCannedResponses.click();
			await poOmnichannel.cannedResponses.btnNew.click();
			await expect(poOmnichannel.cannedResponses.radioPublic).toBeDisabled();
		});
	});

	test('OC - Monitor Role - Current Chats', async ({ page }) => {
		const [conversationA] = conversations;
		const { room: roomA } = conversationA.data;

		await test.step('expect to be able to view only chats from same unit', async () => {
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_A)).toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_B)).toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_C)).toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_D)).not.toBeVisible();
		});

		await test.step('expect to be able to join chats from same unit', async () => {
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
				`Chat On Hold: The chat was manually placed On Hold by ${MONITOR}`,
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

		// await test.step('expect to be able to edit room information from another agent', async () => {);

		await test.step('expect to be able to close a conversation from another agent', async () => {
			await poOmnichannel.content.btnCloseChat.click();
			await poOmnichannel.content.inputModalClosingComment.type('any_comment');
			await poOmnichannel.content.btnModalConfirm.click();
			await expect(poOmnichannel.toastSuccess).toBeVisible();
			await page.waitForURL('/omnichannel/current');
		});

		await test.step('expect not to be able to remove closed room', async () => {
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_A)).toBeVisible();
			await expect(poOmnichannel.currentChats.btnRemoveByName(ROOM_A)).not.toBeVisible();
		});
	});

	test('OC - Monitor Role - Permission revoked', async ({ page, api }) => {
		const [unitA, unitB] = units;
		const [monitor] = monitors;

		await poOmnichannel.omnisidenav.linkCurrentChats.click();

		await test.step('expect not to be able to see chats from removed department', async () => {
			await test.step('expect rooms from both departments to be visible', async () => {
				await expect(poOmnichannel.currentChats.findRowByName(ROOM_B)).toBeVisible();
				await expect(poOmnichannel.currentChats.findRowByName(ROOM_C)).toBeVisible();
				await expect(poOmnichannel.currentChats.findRowByName(ROOM_D)).not.toBeVisible();
			});

			await test.step('expect to remove departmentB from unit', async () => {
				const [departmentA] = departments.map(({ data }) => data);

				await createOrUpdateUnit(api, {
					id: unitA.data._id,
					monitors: [{ monitorId: MONITOR, username: MONITOR }],
					departments: [{ departmentId: departmentA._id }],
				});

				await page.reload();
			});

			await test.step('expect to have only room B visible', async () => {
				await expect(poOmnichannel.currentChats.findRowByName(ROOM_B)).toBeVisible();
				await expect(poOmnichannel.currentChats.findRowByName(ROOM_C)).not.toBeVisible();
				await expect(poOmnichannel.currentChats.findRowByName(ROOM_D)).not.toBeVisible();
			});
		});

		await test.step('expect not to be able to see conversations once unit is removed', async () => {
			const res = await unitA.delete();
			await expect(res.status()).toBe(200);
			await page.reload();
			await expect(page.locator('text="No chats yet"')).toBeVisible();
		});

		await test.step('expect to be able to see all conversations once all units are removed', async () => {
			const res = await unitB.delete();
			await expect(res.status()).toBe(200);
			await page.reload();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_D)).toBeVisible();
		});

		await test.step('expect not to be able to see current chats once role is removed', async () => {
			const res = await monitor.delete();
			await expect(res.status()).toBe(200);
			await page.reload();
			await expect(page.locator('p >> text="You are not authorized to view this page."')).toBeVisible();
		});

		await test.step('expect monitor to be automaticaly removed from unit once monitor is removed', async () => {
			const { data: monitors } = await fetchUnitMonitors(api, unitA.data._id);
			await expect(monitors).toHaveLength(0);
		});
	});
});
