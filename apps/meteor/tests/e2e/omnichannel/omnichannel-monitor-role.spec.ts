import { faker } from '@faker-js/faker';
import { Page } from '@playwright/test';

// import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createMonitor } from '../utils/omnichannel/monitors';
import { createConversation } from '../utils/omnichannel/rooms';
import { createOrUpdateUnit, fetchUnitMonitors } from '../utils/omnichannel/units';
import { test, expect } from '../utils/test';

const MONITOR = 'user3';
const ROOM_A = faker.person.fullName();
const ROOM_B = faker.person.fullName();
const ROOM_C = faker.person.fullName();
const ROOM_D = faker.person.fullName();

test.use({ storageState: Users.user3.state });

test.describe('OC - Monitor Role', () => {
	// test(!IS_EE, 'Enterprise Edition Only');

	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let monitor: Awaited<ReturnType<typeof createMonitor>>;
	let unit: Awaited<ReturnType<typeof createOrUpdateUnit>>;
	let poOmnichannel: HomeOmnichannel;

	/* Verify that once the department is set with the unit,
	 * old/new chats should be displayed under current chats f
	 * and monitor should be allowed to interact with them using Join button.
	 *
	 * - Create department (2x)
	 *
	 * - Create an agent
	 * - Create a monitor
	 * - Create a unit
	 *
	 * - Create a conversation (no department)
	 * - Create a conversation (unit department)
	 * - Create a conversation (different department)
	 *
	 *
	 */

	/*
    Verify that monitor has access to only those chats that are associated with the units
  */

	/*
    Verify if the user is removed from the monitor list, he does not have access to chats
    of a unit he was part of. The system must update the list of a monitor in the unit too.
  */

	/*
    Verify if the department is removed from the unit,
    the monitor should not have access to its chats(New/old both).
  */

	/*
    Verify if unit is deleted, monitor should not be able to see rooms.
  */

	/*
    Verify that a monitor is not allowed to create public Canned Responses.
  */

	// Create agents
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2'), createAgent(api, MONITOR)]);

		const agentsStatuses = await Promise.all(agents.slice(0, 1).map(({ data: agent }) => makeAgentAvailable(api, agent._id)));

		agentsStatuses.forEach((res) => expect(res.status()).toBe(200));
	});

	// Create departments
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api)]);
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
				departmentId: departmentA._id,
			}),
			createConversation(api, {
				visitorName: ROOM_C,
				visitorToken: 'roomC',
				agentId: `user2`,
				departmentId: departmentB._id,
			}),
			createConversation(api, {
				visitorName: ROOM_D,
				visitorToken: 'roomD',
			}),
		]);
	});

	// Create monitor and unit
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);

		monitor = await createMonitor(api, MONITOR);

		unit = await createOrUpdateUnit(api, {
			monitors: [{ monitorId: MONITOR, username: MONITOR }],
			departments: [{ departmentId: departmentA._id }, { departmentId: departmentB._id }],
		});
	});

	// Delete all created data
	test.afterAll(async () => {
		await Promise.all([
			...agents.map((agent) => agent.delete()),
			...departments.map((department) => department.delete()),
			...conversations.map((conversation) => conversation.delete()),
			monitor.delete(),
			unit.delete(),
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
			await poOmnichannel.content.btnReturn.click();
		});

		await test.step('expect to be able to remove closed rooms', async () => {
			await poOmnichannel.currentChats.btnRemoveByName(ROOM_A).click();
			await expect(poOmnichannel.currentChats.modalConfirmRemove).toBeVisible();
			await poOmnichannel.currentChats.btnConfirmRemove.click();
			await expect(poOmnichannel.currentChats.modalConfirmRemove).not.toBeVisible();
			await expect(poOmnichannel.currentChats.findRowByName(ROOM_A)).not.toBeVisible();
		});
	});

	test('OC - Monitor Role - Canned responses', async () => {
		// TODO: move to unit test
		await test.step('expect not to be able to create public canned responses (administration)', async () => {
			await poOmnichannel.omnisidenav.linkCannedResponses.click();
			await poOmnichannel.cannedResponses.btnNew.click();
			await expect(poOmnichannel.cannedResponses.radioPublic).toBeDisabled();
		});
	});

	test('OC - Monitor Role - Permission revoked', async ({ page, api }) => {
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
					id: unit.data._id,
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

		await test.step('expect not to be able to see current chats once unit is removed', async () => {
			const res = await unit.delete();
			await expect(res.status()).toBe(200);
			await page.reload();
			await expect(page.locator('text="No chats yet"')).toBeVisible();
		});

		await test.step('expect not to be able to see current chats once role is removed', async () => {
			const res = await monitor.delete();
			await expect(res.status()).toBe(200);
			await page.reload();
			await expect(page.locator('p >> text="You are not authorized to view this page."')).toBeVisible();
		});

		await test.step('expect monitor to be automaticaly removed from unit once monitor is removed', async () => {
			const { data: monitors } = await fetchUnitMonitors(api, unit.data._id);
			await expect(monitors).toHaveLength(0);
		});
	});
});
