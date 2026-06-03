import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createManager } from '../utils/omnichannel/managers';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Forwarding to away departments (EE)', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let poHomeOmnichannelOnlineAgent: HomeOmnichannel;
	let poHomeOmnichannelAwayAgent: HomeOmnichannel;

	let omnichannelPage: Page | undefined;

	let manager: Awaited<ReturnType<typeof createManager>>;
	let onlineAgent: Awaited<ReturnType<typeof createAgent>>;
	let awayAgent: Awaited<ReturnType<typeof createAgent>>;
	let initialDepartment: Awaited<ReturnType<typeof createDepartment>>;
	let forwardToOfflineDepartment: Awaited<ReturnType<typeof createDepartment>>;
	let conversation: Awaited<ReturnType<typeof createConversation>>;
	let visitor: { name: string; email: string };

	test.beforeAll(async ({ api }) => {
		[manager, onlineAgent, awayAgent, initialDepartment, forwardToOfflineDepartment] = await Promise.all([
			createManager(api, 'user1'),
			createAgent(api, 'user1'),
			createAgent(api, 'user2'),
			createDepartment(api, { name: 'Initial Dept' }),
			createDepartment(api, { name: 'Forward Dept', allowReceiveForwardOffline: true }),
		]);
		await expect(manager.response).toBeOK();
		await expect(onlineAgent.response).toBeOK();
		await expect(awayAgent.response).toBeOK();
		await expect(initialDepartment.response).toBeOK();
		await expect(forwardToOfflineDepartment.response).toBeOK();

		const responses = await Promise.all([
			setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300),
			setSettingValueById(api, 'Omnichannel_enable_department_removal', true),
			setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false),
			addAgentToDepartment(api, { department: initialDepartment.data, agentId: 'user1' }),
			addAgentToDepartment(api, { department: forwardToOfflineDepartment.data, agentId: 'user2' }),
		]);

		for (const response of responses) {
			await expect(response).toBeOK();
		}
	});

	test.beforeEach(async ({ page, browser, api }) => {
		visitor = createFakeVisitor();
		// Online Agent window opens with idleTimeLimit of 300 by default, therefore it will remain online
		poHomeOmnichannelOnlineAgent = new HomeOmnichannel(page);
		await poHomeOmnichannelOnlineAgent.page.goto('/');
		await poHomeOmnichannelOnlineAgent.waitForHome();

		await expect(await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1)).toBeOK();

		// Away Agent window opens with idleTimeLimit of 1, therefore after a second it will turn away
		({ page: omnichannelPage } = await createAuxContext(browser, Users.user2, '/', false));
		poHomeOmnichannelAwayAgent = new HomeOmnichannel(omnichannelPage);
		await expect(poHomeOmnichannelAwayAgent.navbar.getUserStatusBadge('away')).toBeVisible();
	});

	test.afterEach(async ({ api }) => {
		if (omnichannelPage) {
			await omnichannelPage.context().close();
		}

		await expect(await setSettingValueById(api, 'Livechat_waiting_queue', false)).toBeOK();
		await expect(await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300)).toBeOK();
	});

	test.afterAll(async ({ api }) => {
		const responses = await Promise.all([
			initialDepartment.delete(),
			forwardToOfflineDepartment.delete(),
			manager.delete(),
			onlineAgent.delete(),
			awayAgent.delete(),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_enabled_when_agent_idle', true),
			setSettingValueById(api, 'Omnichannel_enable_department_removal', false),
		]);
		for (const response of responses) {
			await expect(response).toBeOK();
		}
	});

	test('when manager forward to offline (agent away, accept when agent idle off) department the inquiry should be set to the queue', async ({
		api,
	}) => {
		await test.step('Setup routing settings', async () => {
			await expect(await setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection')).toBeOK();
		});

		await test.step('Visitor initiates chat', async () => {
			conversation = await createConversation(api, { visitorName: visitor.name, agentId: onlineAgent.data._id });
		});

		await test.step('Manager forwards chat', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward).not.toBeVisible();
		});

		await test.step('Check inquiry status via API is queued', async () => {
			const inquiryResp = await api.get(`/livechat/inquiries.getOne?roomId=${conversation.data.room._id}`);
			await expect(inquiryResp).toBeOK();
			const inquiryBody = await inquiryResp.json();

			expect(inquiryBody.inquiry.status).toBe('queued');
			expect(inquiryBody.inquiry.department).toBe(forwardToOfflineDepartment.data._id);
		});
	});

	test('when manager forward to a department while waiting_queue is active and allowReceiveForwardOffline is true, chat should end in departments queue', async ({
		api,
	}) => {
		await test.step('Setup routing settings', async () => {
			await expect(await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection')).toBeOK();
		});

		await test.step('Visitor initiates chat', async () => {
			conversation = await createConversation(api, { visitorName: visitor.name, agentId: onlineAgent.data._id });
		});

		await test.step('Manager enables queue and forwards chat', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await expect(await setSettingValueById(api, 'Livechat_waiting_queue', true)).toBeOK();

			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward).not.toBeVisible();
		});

		await test.step('Check inquiry status via API is queued', async () => {
			const inquiryResp = await api.get(`/livechat/inquiries.getOne?roomId=${conversation.data.room._id}`);
			await expect(inquiryResp).toBeOK();
			const inquiryBody = await inquiryResp.json();

			expect(inquiryBody.inquiry.status).toBe('queued');
			expect(inquiryBody.inquiry.department).toBe(forwardToOfflineDepartment.data._id);
		});
	});

	test('when manager forward to a department while waiting_queue is active and allowReceiveForwardOffline is false, transfer should fail', async ({
		api,
	}) => {
		await test.step('Setup routing and department settings', async () => {
			await expect(await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection')).toBeOK();
			await expect(
				await api.put(`/livechat/department/${forwardToOfflineDepartment.data._id}`, {
					department: { ...forwardToOfflineDepartment.data, allowReceiveForwardOffline: false },
				}),
			).toBeOK();
		});

		await test.step('Visitor initiates chat', async () => {
			conversation = await createConversation(api, { visitorName: visitor.name, agentId: onlineAgent.data._id });
		});

		await test.step('Manager attempts to forward and sees error', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await expect(await setSettingValueById(api, 'Livechat_waiting_queue', true)).toBeOK();

			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.page.locator('role=alert')).toContainText(
				'No agents are available for service on this department.',
			);
		});

		await test.step('Restore department setting', async () => {
			await expect(
				await api.put(`/livechat/department/${forwardToOfflineDepartment.data._id}`, {
					department: { ...forwardToOfflineDepartment.data, allowReceiveForwardOffline: true },
				}),
			).toBeOK();
		});
	});

	test('when manager forward to online (agent away, accept when agent idle on) department the inquiry should not be set to the queue', async ({
		api,
	}) => {
		await test.step('Setup routing settings', async () => {
			await expect(await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection')).toBeOK();
		});

		await test.step('Visitor initiates chat', async () => {
			conversation = await createConversation(api, { visitorName: visitor.name, agentId: onlineAgent.data._id });
		});

		await test.step('Set Livechat_enabled_when_agent_idle to true', async () => {
			// We set Livechat_enabled_when_agent_idle to true here in order to not assign the away agent in the previous step
			await expect(await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', true)).toBeOK();
		});

		await test.step('Manager forwards chat successfully', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward).not.toBeVisible();
		});

		await test.step('Check room routing via API serves to away agent', async () => {
			const inquiryResp = await api.get(`/livechat/inquiries.getOne?roomId=${conversation.data.room._id}`);
			await expect(inquiryResp).toBeOK();
			const inquiryBody = await inquiryResp.json();
			expect(inquiryBody.inquiry.status).toBe('taken');
			expect(inquiryBody.inquiry.department).toBe(forwardToOfflineDepartment.data._id);
		});
	});
});
