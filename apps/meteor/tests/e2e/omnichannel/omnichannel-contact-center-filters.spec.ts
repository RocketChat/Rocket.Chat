import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelContacts } from '../page-objects/omnichannel-contacts-list';
import { OmnichannelSection } from '../page-objects/omnichannel-section';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createConversation, updateRoom } from '../utils/omnichannel/rooms';
import { createTag } from '../utils/omnichannel/tags';
import { createOrUpdateUnit } from '../utils/omnichannel/units';
import { test, expect } from '../utils/test';

const URL = {
	contactCenterChats: '/omnichannel-directory/chats',
};

const visitorA = createFakeVisitor().name;
const visitorB = createFakeVisitor().name;
const visitorC = createFakeVisitor().name;

test.skip(!IS_EE, 'OC - Contact center Filters > Enterprise Only');

test.use({ storageState: Users.admin.state });

test.describe('OC - Contact Center', async () => {
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let tags: Awaited<ReturnType<typeof createTag>>[];
	let units: Awaited<ReturnType<typeof createOrUpdateUnit>>[];
	let poContacts: OmnichannelContacts;
	let poOmniSection: OmnichannelSection;

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
		tags = await Promise.all([createTag(api, { name: 'tagA' }), createTag(api, { name: 'tagB' })]);

		tags.forEach((res) => expect(res.response.status()).toBe(200));
	});

	// Create unit
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map((dep) => dep.data);
		units = await Promise.all([
			createOrUpdateUnit(api, {
				monitors: [{ monitorId: 'user1', username: 'user1' }],
				departments: [{ departmentId: departmentA._id }],
			}),
			createOrUpdateUnit(api, {
				monitors: [{ monitorId: 'user2', username: 'user2' }],
				departments: [{ departmentId: departmentB._id }],
			}),
		]);
		units.forEach((res) => expect(res.response.status()).toBe(200));
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

	test.afterAll(async ({ api }) => {
		await Promise.all([
			// Delete conversations
			...conversations.map((conversation) => conversation.delete()),
			// // Delete departments
			...departments.map((department) => department.delete()),
			// Delete agents
			...agents.map((agent) => agent.delete()),
			// Delete tags
			...tags.map((tag) => tag.delete()),
			// Delete units
			...units.map((unit) => unit.delete()),
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
			api.post('/livechat/room.close', {
				rid: conversationC.room._id,
				token: visitorC,
			}),
		]);

		statesPromises.forEach((res) => expect(res.status()).toBe(200));
	});

	test.beforeEach(async ({ page }) => {
		poContacts = new OmnichannelContacts(page);
		poOmniSection = new OmnichannelSection(page);
		await page.goto('/');
		await poOmniSection.btnContactCenter.click();
		await poContacts.tabChats.click();
		await page.waitForURL(URL.contactCenterChats);
	});

	test('OC - Contact Center - Filters', async () => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);
		const [unitA, unitB] = units.map((unit) => unit.data);

		await test.step('expect to filter by guest', async () => {
			await poContacts.inputSearch.fill(visitorA);
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
			await expect(poContacts.btnSearchChip(visitorA)).toBeVisible();

			await poContacts.inputSearch.fill('');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter by Served By', async () => {
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();

			await poContacts.btnFilters.click();

			// Select user1
			await poContacts.selectServedBy('user1');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.btnServedByChip('user1')).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();

			// Select user2
			await poContacts.btnServedByChip('user1').locator('i').click();
			await poContacts.selectServedBy('user2');
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
			await expect(poContacts.btnServedByChip('user2')).toBeVisible();

			// Select all users
			await poContacts.btnServedByChip('user2').locator('i').click();
			await poContacts.selectServedBy('user1');
			await poContacts.selectServedBy('user2');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await poContacts.btnServedByChip('user1').locator('i').click();
		});

		await test.step('expect to filter by status', async () => {
			await poContacts.selectStatus('closed');
			await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).toBeVisible();
			await expect(poContacts.btnStatusChip('Closed')).toBeVisible();

			await poContacts.selectStatus('opened');
			await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
			await expect(poContacts.btnStatusChip('Open')).toBeVisible();

			await poContacts.selectStatus('all');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).toBeVisible();

			await poContacts.selectStatus('onhold');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
			await expect(poContacts.btnStatusChip('On hold')).toBeVisible();
			await poContacts.btnStatusChip('On hold').locator('i').click();
		});

		await test.step('expect to filter by department', async () => {
			// select department A
			await poContacts.selectDepartment(departmentA.name);
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
			await expect(poContacts.btnDepartmentChip(departmentA.name)).toBeVisible();
			await poContacts.btnDepartmentChip(departmentA.name).locator('i').click();

			// select department B
			await poContacts.selectDepartment(departmentB.name);
			await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
			await expect(poContacts.btnDepartmentChip(departmentB.name)).toBeVisible();
			await poContacts.btnDepartmentChip(departmentB.name).locator('i').click();

			// select all departments
			await poContacts.selectDepartment(departmentA.name);
			await poContacts.selectDepartment(departmentB.name);
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter by tags', async () => {
			await poContacts.selectTag('tagA');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();

			await poContacts.selectTag('tagB');
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();

			await poContacts.removeTag('tagA');
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();

			await poContacts.removeTag('tagB');
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
		});

		await test.step('expect to filter by units', async () => {
			// select unitA
			await poContacts.selectUnit(unitA.name);
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
			await poContacts.btnUnitsChip(unitA.name).locator('i').click();

			// select unitB
			await poContacts.selectUnit(unitB.name);
			await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
			await poContacts.btnUnitsChip(unitB.name).locator('i').click();

			// no unit selected
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
		});
	});

	test('OC - Contact Center - Clear all applied Filters', async () => {
		const [departmentA] = departments.map(({ data }) => data);
		const [unitA] = units.map((unit) => unit.data);

		await test.step('expect to display result as per applied filters ', async () => {
			await poContacts.btnFilters.click();
			await poContacts.selectServedBy('user1');
			await poContacts.selectStatus('onhold');
			await poContacts.selectDepartment(departmentA.name);
			await poContacts.selectTag('tagA');
			await poContacts.selectUnit(unitA.name);

			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
		});

		await test.step('expect to clear all filters ', async () => {
			await poContacts.btnClearFilters.click();
			await expect(poContacts.findRowByName(visitorA)).toBeVisible();
			await expect(poContacts.findRowByName(visitorB)).toBeVisible();
			await expect(poContacts.findRowByName(visitorC)).toBeVisible();
		});
	});

	test('OC - Contact Center - Close contextual bar with filter screen', async () => {
		await test.step('expect to close filters contextual bar ', async () => {
			await poContacts.btnFilters.click();
			await poContacts.btnClose.click();
			await expect(poContacts.btnFilters).toBeVisible();
			await expect(poContacts.btnClearFilters).not.toBeVisible();
		});
	});
});
