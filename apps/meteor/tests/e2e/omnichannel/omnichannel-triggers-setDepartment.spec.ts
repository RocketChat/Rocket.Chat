import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

declare const window: Window & {
	RocketChat: { livechat: { setDepartment: (dep: string) => void; maximizeWidget: () => void } };
};

test.use({ storageState: Users.admin.state });
test.describe('OC - Livechat Triggers - SetDepartment', () => {
	test.skip(!IS_EE, 'Enterprise Only');
	let poLiveChat: OmnichannelLiveChatEmbedded;
	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let departmentA: Awaited<ReturnType<typeof createDepartment>>['data'];
	let departmentB: Awaited<ReturnType<typeof createDepartment>>['data'];
	let agents: Awaited<ReturnType<typeof createDepartment>>[];
	let agent1: Awaited<ReturnType<typeof createAgent>>['data'];
	let agent2: Awaited<ReturnType<typeof createAgent>>['data'];
	let poHomeOmnichannelAgent1: HomeOmnichannel;
	let poHomeOmnichannelAgent2: HomeOmnichannel;

	test.beforeAll(async ({ api }) => {
		// Assign agents & departments
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2')]);
		[agent1, agent2] = agents.map(({ data }) => data);
		departments = await Promise.all([
			createDepartment(api, { showOnRegistration: true }),
			createDepartment(api, { showOnRegistration: true }),
		]);

		[departmentA, departmentB] = departments.map(({ data }) => data);

		await Promise.all([
			addAgentToDepartment(api, { department: departmentA, agentId: agent1._id }),
			addAgentToDepartment(api, { department: departmentB, agentId: agent2._id }),
			api.post(
				'/livechat/triggers',

				{
					name: 'open',
					description: '',
					enabled: true,
					runOnce: false,
					conditions: [
						{
							name: 'chat-opened-by-visitor',
							value: '',
						},
					],
					actions: [
						{
							name: 'send-message',
							params: {
								name: '',
								msg: 'This is a trigger message open by visitor',
								sender: 'queue',
							},
						},
					],
				},
			),
		]);
	});

	test.beforeEach(async ({ browser, page }) => {
		const { page: agent1Page } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannelAgent1 = new HomeOmnichannel(agent1Page);
		const { page: agent2Page } = await createAuxContext(browser, Users.user2, '/', true);
		poHomeOmnichannelAgent2 = new HomeOmnichannel(agent2Page);

		poLiveChat = new OmnichannelLiveChatEmbedded(page);
	});

	test.afterEach(async ({ page }) => {
		await poHomeOmnichannelAgent1.page.close();
		await poHomeOmnichannelAgent2.page.close();
		await poLiveChat.page.close();
		await page.close();
	});

	test.afterAll(async ({ api }) => {
		const ids = (await (await api.get('/livechat/triggers')).json()).triggers.map(
			(trigger: { _id: string }) => trigger._id,
		) as unknown as string[];

		await Promise.all(ids.map((id) => api.delete(`/livechat/triggers/${id}`)));
		expect((await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status()).toBe(200);
		await Promise.all([...agents.map((agent) => agent.delete())]);
		await Promise.all([...departments.map((department) => department.delete())]);
		expect((await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status()).toBe(200);
		await api.post('/settings/Livechat_registration_form', { value: true });
	});

	test('OC - Livechat Triggers - setDepartment should affect agent.next call', async () => {
		await poLiveChat.page.goto('/packages/rocketchat_livechat/assets/demo.html');

		const depId = departmentB._id;

		await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.setDepartment(depId), depId);

		await poLiveChat.openLiveChat();

		await expect(poLiveChat.txtChatMessage('This is a trigger message open by visitor')).toBeVisible();

		await expect(poLiveChat.headerTitle).toContainText(agent2.username);
	});

	test('OC - Livechat Triggers - setDepartment should affect agent.next call - Register Form Disabled', async ({ api }) => {
		await api.post('/settings/Livechat_registration_form', { value: false });

		await poLiveChat.page.goto('/packages/rocketchat_livechat/assets/demo.html');

		const depId = departmentB._id;

		await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.setDepartment(depId), depId);

		await poLiveChat.openLiveChat();

		await expect(poLiveChat.txtChatMessage('This is a trigger message open by visitor')).toBeVisible();

		await expect(poLiveChat.headerTitle).toContainText(agent2.username);
	});
});
