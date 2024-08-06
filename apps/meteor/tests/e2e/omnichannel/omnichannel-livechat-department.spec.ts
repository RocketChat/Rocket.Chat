import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Department Flow', () => {
	// Needs Departments to test this, so needs an EE license for multiple deps
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannelAgent1: HomeOmnichannel;
	let poHomeOmnichannelAgent2: HomeOmnichannel;
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let departmentA: Awaited<ReturnType<typeof createDepartment>>['data'];
	let departmentB: Awaited<ReturnType<typeof createDepartment>>['data'];
	let agents: Awaited<ReturnType<typeof createDepartment>>[];
	let agent1: Awaited<ReturnType<typeof createAgent>>['data'];
	let agent2: Awaited<ReturnType<typeof createAgent>>['data'];

	test.beforeAll(async ({ api }) => {
		// Assign agents & departments
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2')]);
		[agent1, agent2] = agents.map(({ data }) => data);
		departments = await Promise.all([
			createDepartment(api, { showOnRegistration: true }),
			createDepartment(api, { showOnRegistration: true }),
		]);
		[departmentA, departmentB] = departments.map(({ data }) => data);
		await addAgentToDepartment(api, { department: departmentA, agentId: agent1._id });
		await addAgentToDepartment(api, { department: departmentB, agentId: agent2._id });
	});

	test.beforeEach(async ({ page, api, browser }) => {
		// Create Pages
		const { page: agent1Page } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannelAgent1 = new HomeOmnichannel(agent1Page);
		const { page: agent2Page } = await createAuxContext(browser, Users.user2, '/', true);
		poHomeOmnichannelAgent2 = new HomeOmnichannel(agent2Page);

		poLiveChat = new OmnichannelLiveChat(page, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.afterEach(async ({ page }) => {
		await poHomeOmnichannelAgent1.page.close();
		await poHomeOmnichannelAgent2.page.close();
		await page.close();
	});

	test.afterAll(async ({ api }) => {
		await expect((await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status()).toBe(200);
		await Promise.all([...agents.map((agent) => agent.delete())]);
		await Promise.all([...departments.map((department) => department.delete())]);
		await expect((await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status()).toBe(200);
	});

	test('OC - Livechat - Chat with Department', async () => {
		const guest = createFakeVisitor();

		await test.step('expect start Chat with department', async () => {
			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(guest, false, departmentA.name);
			await expect(poLiveChat.onlineAgentMessage).toBeVisible();
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect message to be received by department', async () => {
			await poHomeOmnichannelAgent1.sidenav.openChat(guest.name);
			await expect(poHomeOmnichannelAgent1.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannelAgent1.content.lastUserMessage).toContainText('this_a_test_message_from_user');
		});

		await test.step('expect message to be sent by department', async () => {
			await poHomeOmnichannelAgent1.content.sendMessage('this_a_test_message_from_agent');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent"')).toBeVisible();
		});
	});

	test('OC - Livechat - Change Department', async () => {
		const guest = createFakeVisitor();
		await test.step('expect start Chat with department', async () => {
			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(guest, false, departmentA.name);
			await expect(poLiveChat.onlineAgentMessage).toBeVisible();
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect message to be received by department 1', async () => {
			await poHomeOmnichannelAgent1.sidenav.openChat(guest.name);
			await expect(poHomeOmnichannelAgent1.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannelAgent1.content.lastUserMessage).toContainText('this_a_test_message_from_user');
		});

		await test.step('expect message to be sent by department 1', async () => {
			await poHomeOmnichannelAgent1.content.sendMessage('this_a_test_message_from_agent_department_1');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent_department_1"')).toBeVisible();
			await poHomeOmnichannelAgent1.page.close();
		});

		await test.step('expect to change department', async () => {
			await poLiveChat.btnOptions.click();
			await poLiveChat.btnChangeDepartment.click();

			await expect(poLiveChat.selectDepartment).toBeVisible();
			await poLiveChat.selectDepartment.selectOption({ label: departmentB.name });

			await expect(poLiveChat.btnSendMessage('Start chat')).toBeEnabled();
			await poLiveChat.btnSendMessage('Start chat').click();

			await expect(poLiveChat.livechatModal).toBeVisible();

			await expect(poLiveChat.livechatModalText('Are you sure you want to switch the department?')).toBeVisible();
			await poLiveChat.btnYes.click();

			await expect(poLiveChat.livechatModal).toBeVisible();

			await expect(poLiveChat.livechatModalText('Department switched')).toBeVisible();
			await poLiveChat.btnOk.click();

			// Expect keep chat history
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();

			// Expect user to have changed
			await expect(await poLiveChat.headerTitle.textContent()).toEqual(agent2.username);

			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user_to_department_2');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user_to_department_2"')).toBeVisible();
		});

		await test.step('expect message to be received by department', async () => {
			await poHomeOmnichannelAgent2.sidenav.openChat(guest.name);
			await expect(poHomeOmnichannelAgent2.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannelAgent2.content.lastUserMessage).toContainText('this_a_test_message_from_user_to_department_2');
		});

		await test.step('expect message to be sent by department', async () => {
			await poHomeOmnichannelAgent2.content.sendMessage('this_a_test_message_from_agent_department_2');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent_department_2"')).toBeVisible();
		});
	});
});
