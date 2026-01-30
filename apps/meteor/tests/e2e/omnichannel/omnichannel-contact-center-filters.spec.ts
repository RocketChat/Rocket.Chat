import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { Navbar } from '../page-objects/fragments';
import { OmnichannelContactCenterChats } from '../page-objects/omnichannel';
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
	let tagA: Awaited<ReturnType<typeof createTag>>;
	let tagB: Awaited<ReturnType<typeof createTag>>;
	let units: Awaited<ReturnType<typeof createOrUpdateUnit>>[];
	let poNavbar: Navbar;
	let poOmniChats: OmnichannelContactCenterChats;

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
				tags: [tagA.data.name],
			}),
			updateRoom(api, {
				roomId: conversationB.room._id,
				visitorId: conversationB.visitor._id,
				tags: [tagB.data.name],
			}),
		]);
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
		poOmniChats = new OmnichannelContactCenterChats(page);
		poNavbar = new Navbar(page);

		await page.goto('/');
		await poNavbar.btnContactCenter.click();
		await poOmniChats.tabChats.click();
		await page.waitForURL(URL.contactCenterChats);
	});

	test('OC - Contact Center - Filters', async () => {
		const [departmentA, departmentB] = departments.map(({ data }) => data);
		const [unitA, unitB] = units.map((unit) => unit.data);

		await test.step('expect to filter by guest', async () => {
			await poOmniChats.inputSearch.fill(visitorA);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();
			await expect(poOmniChats.btnSearchChip(visitorA)).toBeVisible();

			await poOmniChats.inputSearch.fill('');
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter by Served By', async () => {
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();

			await poOmniChats.btnFilters.click();

			// Select user1
			await poOmniChats.filters.selectServedBy('user1');
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.btnServedByChip('user1')).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();

			// Select user2
			await poOmniChats.btnServedByChip('user1').locator('i').click();
			await poOmniChats.filters.selectServedBy('user2');
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorA)).not.toBeVisible();
			await expect(poOmniChats.btnServedByChip('user2')).toBeVisible();

			// Select all users
			await poOmniChats.btnServedByChip('user2').locator('i').click();
			await poOmniChats.filters.selectServedBy('user1');
			await poOmniChats.filters.selectServedBy('user2');
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await poOmniChats.btnServedByChip('user1').locator('i').click();
		});

		await test.step('expect to filter by status', async () => {
			await poOmniChats.filters.selectStatus('Closed');
			await expect(poOmniChats.table.findRowByName(visitorA)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).toBeVisible();
			await expect(poOmniChats.btnStatusChip('Closed')).toBeVisible();

			await poOmniChats.filters.selectStatus('Open');
			await expect(poOmniChats.table.findRowByName(visitorA)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
			await expect(poOmniChats.btnStatusChip('Open')).toBeVisible();

			await poOmniChats.filters.selectStatus('all');
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).toBeVisible();

			await poOmniChats.filters.selectStatus('On hold');
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
			await expect(poOmniChats.btnStatusChip('On hold')).toBeVisible();
			await poOmniChats.btnStatusChip('On hold').locator('i').click();
		});

		await test.step('expect to filter by department', async () => {
			// select department A
			await poOmniChats.filters.selectDepartment(departmentA.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
			await expect(poOmniChats.btnDepartmentChip(departmentA.name)).toBeVisible();
			await poOmniChats.btnDepartmentChip(departmentA.name).locator('i').click();

			// select department B
			await poOmniChats.filters.selectDepartment(departmentB.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
			await expect(poOmniChats.btnDepartmentChip(departmentB.name)).toBeVisible();
			await poOmniChats.btnDepartmentChip(departmentB.name).locator('i').click();

			// select all departments
			await poOmniChats.filters.selectDepartment(departmentA.name);
			await poOmniChats.filters.selectDepartment(departmentB.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter by tags', async () => {
			await poOmniChats.filters.selectTag(tagA.data.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();

			await poOmniChats.filters.selectTag(tagB.data.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();

			await poOmniChats.filters.removeTag(tagA.data.name);
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorA)).not.toBeVisible();

			await poOmniChats.filters.removeTag(tagB.data.name);
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
		});

		await test.step('expect to filter by units', async () => {
			// select unitA
			await poOmniChats.filters.selectUnit(unitA.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
			await poOmniChats.btnUnitsChip(unitA.name).locator('i').click();

			// select unitB
			await poOmniChats.filters.selectUnit(unitB.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
			await poOmniChats.btnUnitsChip(unitB.name).locator('i').click();

			// no unit selected
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
		});
	});

	test('OC - Contact Center - Clear all applied Filters', async () => {
		const [departmentA] = departments.map(({ data }) => data);
		const [unitA] = units.map((unit) => unit.data);

		await test.step('expect to display result as per applied filters ', async () => {
			await poOmniChats.btnFilters.click();
			await poOmniChats.filters.selectServedBy('user1');
			await poOmniChats.filters.selectStatus('On hold');
			await poOmniChats.filters.selectDepartment(departmentA.name);
			await poOmniChats.filters.selectTag(tagA.data.name);
			await poOmniChats.filters.selectUnit(unitA.name);
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).not.toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).not.toBeVisible();
		});

		await test.step('expect to clear all filters ', async () => {
			await poOmniChats.filters.btnClearFilters.click();
			await expect(poOmniChats.table.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorB)).toBeVisible();
			await expect(poOmniChats.table.findRowByName(visitorC)).toBeVisible();
		});
	});

	test('OC - Contact Center - Close contextual bar with filter screen', async () => {
		await test.step('expect to close filters contextual bar ', async () => {
			await poOmniChats.btnFilters.click();
			await poOmniChats.filters.close();
			await expect(poOmniChats.btnFilters).toBeVisible();
			await expect(poOmniChats.filters.btnClearFilters).not.toBeVisible();
		});
	});
});
