import type { Page } from '@playwright/test';
import type { IRoom } from '@rocket.chat/core-typings';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createManager } from '../utils/omnichannel/managers';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Forwarding to away agents (EE)', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let poHomeOmnichannelOnlineAgent: HomeOmnichannel;
	let poHomeOmnichannelAwayAgent: HomeOmnichannel;
	let poLivechat: OmnichannelLiveChat;

	let livechatPage: Page;
	let omnichannelPage: Page;

	let manager: Awaited<ReturnType<typeof createManager>>;
	let onlineAgent: Awaited<ReturnType<typeof createAgent>>;
	let awayAgent: Awaited<ReturnType<typeof createAgent>>;
	let initialDepartment: Awaited<ReturnType<typeof createDepartment>>;
	let forwardToOfflineDepartment: Awaited<ReturnType<typeof createDepartment>>;
	let visitor: { name: string; email: string };

	test.beforeAll(async ({ api }) => {
		[manager, onlineAgent, awayAgent, initialDepartment, forwardToOfflineDepartment] = await Promise.all([
			createManager(api, 'user1'),
			createAgent(api, 'user1'),
			createAgent(api, 'user2'),
			createDepartment(api, { name: 'Initial Dept' }),
			createDepartment(api, { name: 'Forward Dept', allowReceiveForwardOffline: true }),
			setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300),
			expect(await setSettingValueById(api, 'Omnichannel_enable_department_removal', true)).toBeOK(),
		]);

		await Promise.all([
			addAgentToDepartment(api, { department: initialDepartment.data, agentId: 'user1' }),
			addAgentToDepartment(api, { department: forwardToOfflineDepartment.data, agentId: 'user2' }),
		]);
	});

	test.beforeEach(async ({ page, browser, api }) => {
		visitor = createFakeVisitor();
		poHomeOmnichannelOnlineAgent = new HomeOmnichannel(page);
		await page.goto('/');
		await page.locator('#main-content').waitFor();

		({ page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false));
		poLivechat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.afterEach(async ({ api }) => {
		if (livechatPage) {
			await livechatPage.context().close();
		}
		if (omnichannelPage) {
			await omnichannelPage.context().close();
		}

		await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			initialDepartment.delete(),
			forwardToOfflineDepartment.delete(),
			manager.delete(),
			onlineAgent.delete(),
			awayAgent.delete(),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false),
			expect(await setSettingValueById(api, 'Omnichannel_enable_department_removal', false)).toBeOK(),
		]);
	});

	test('when manager forward to offline (agent away, accept when agent idle off) department the inquiry should be set to the queue', async ({
		api,
		browser,
	}) => {
		await test.step('Setup routing settings', async () => {
			await setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection');
			await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false);
		});

		await test.step('Visitor initiates chat', async () => {
			await poLivechat.page.reload();
			await poLivechat.openAnyLiveChat();
			await poLivechat.sendMessage(visitor, false);
			await poLivechat.onlineAgentMessage.fill('test');
			await poLivechat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Set user2 agent away by idle timeout', async () => {
			await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1);
			({ page: omnichannelPage } = await createAuxContext(browser, Users.user2, '/', false));
			poHomeOmnichannelAwayAgent = new HomeOmnichannel(omnichannelPage);
			await expect(poHomeOmnichannelAwayAgent.navbar.getUserStatusBadge('away')).toBeVisible();
		});

		await test.step('Manager forwards chat', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward).not.toBeVisible();
		});

		await test.step('Check inquiry status via API is queued', async () => {
			const roomInfoResp = await api.get(`/livechat/rooms`);
			const roomBody = await roomInfoResp.json();
			const roomId = roomBody.rooms.find((room: IRoom) => room.fname === visitor.name)._id;

			const inquiryResp = await api.get(`/livechat/inquiries.getOne?roomId=${roomId}`);
			const inquiryBody = await inquiryResp.json();

			expect(inquiryBody.inquiry.status).toBe('queued');
			expect(inquiryBody.inquiry.department).toBe(forwardToOfflineDepartment.data._id);
		});
	});

	test('when manager forward to a department while waiting_queue is active and allowReceiveForwardOffline is true, chat should end in departments queue', async ({
		api,
		browser,
	}) => {
		await test.step('Setup routing settings', async () => {
			await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection');
		});

		await test.step('Visitor initiates chat', async () => {
			await poLivechat.page.reload();
			await poLivechat.openAnyLiveChat();
			await poLivechat.sendMessage(visitor, false);
			await poLivechat.onlineAgentMessage.fill('test');
			await poLivechat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Set user2 agent away by idle timeout', async () => {
			await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1);
			({ page: omnichannelPage } = await createAuxContext(browser, Users.user2, '/', false));
			poHomeOmnichannelAwayAgent = new HomeOmnichannel(omnichannelPage);
			await expect(poHomeOmnichannelAwayAgent.navbar.getUserStatusBadge('away')).toBeVisible();
		});

		await test.step('Manager enables queue and forwards chat', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await setSettingValueById(api, 'Livechat_waiting_queue', true);

			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward).not.toBeVisible();
		});

		await test.step('Check inquiry status via API is queued', async () => {
			const roomInfoResp = await api.get(`/livechat/rooms`);
			const roomBody = await roomInfoResp.json();
			const roomId = roomBody.rooms.find((room: IRoom) => room.fname === visitor.name)._id;

			const inquiryResp = await api.get(`/livechat/inquiries.getOne?roomId=${roomId}`);
			const inquiryBody = await inquiryResp.json();

			expect(inquiryBody.inquiry.status).toBe('queued');
			expect(inquiryBody.inquiry.department).toBe(forwardToOfflineDepartment.data._id);
		});

		await test.step('Disable waiting queue', async () => {
			await setSettingValueById(api, 'Livechat_waiting_queue', false);
		});
	});

	test('when manager forward to a department while waiting_queue is active and allowReceiveForwardOffline is false, transfer should fail', async ({
		api,
		browser,
	}) => {
		await test.step('Setup routing and department settings', async () => {
			await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection');
			await api.put(`/livechat/department/${forwardToOfflineDepartment.data._id}`, {
				department: { ...forwardToOfflineDepartment.data, allowReceiveForwardOffline: false },
			});
		});

		await test.step('Visitor initiates chat', async () => {
			await poLivechat.page.reload();
			await poLivechat.openAnyLiveChat();
			await poLivechat.sendMessage(visitor, false);
			await poLivechat.onlineAgentMessage.fill('test');
			await poLivechat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Set user2 agent away by idle timeout', async () => {
			await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1);
			({ page: omnichannelPage } = await createAuxContext(browser, Users.user2, '/', false));
			poHomeOmnichannelAwayAgent = new HomeOmnichannel(omnichannelPage);
			await expect(poHomeOmnichannelAwayAgent.navbar.getUserStatusBadge('away')).toBeVisible();
		});

		await test.step('Manager attempts to forward and sees error', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await setSettingValueById(api, 'Livechat_waiting_queue', true);

			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.page.locator('role=alert')).toContainText(
				'No agents are available for service on this department.',
			);
		});

		await test.step('Restore department setting', async () => {
			await api.put(`/livechat/department/${forwardToOfflineDepartment.data._id}`, {
				department: { ...forwardToOfflineDepartment.data, allowReceiveForwardOffline: true },
			});
		});

		await test.step('Disable waiting queue', async () => {
			await setSettingValueById(api, 'Livechat_waiting_queue', false);
		});
	});

	test('when manager forward to online (agent away, accept when agent idle on) department the inquiry should not be set to the queue', async ({
		api,
		browser,
	}) => {
		await test.step('Setup routing settings', async () => {
			await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection');
			await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', true);
		});

		await test.step('Visitor initiates chat', async () => {
			await poLivechat.page.reload();
			await poLivechat.openAnyLiveChat();
			await poLivechat.sendMessage(visitor, false);
			await poLivechat.onlineAgentMessage.fill('test');
			await poLivechat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Set user2 agent away by idle timeout', async () => {
			await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1);
			({ page: omnichannelPage } = await createAuxContext(browser, Users.user2, '/', false));
			poHomeOmnichannelAwayAgent = new HomeOmnichannel(omnichannelPage);
			await expect(poHomeOmnichannelAwayAgent.navbar.getUserStatusBadge('away')).toBeVisible();
		});

		await test.step('Manager forwards chat successfully', async () => {
			await poHomeOmnichannelOnlineAgent.sidebar.getSidebarItemByName(visitor.name).click();
			await poHomeOmnichannelOnlineAgent.quickActionsRoomToolbar.forwardChat();
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.selectDepartment('Forward Dept');
			await poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward.click();
			await expect(poHomeOmnichannelOnlineAgent.content.forwardChatModal.btnForward).not.toBeVisible();
		});

		await test.step('Check room routing via API serves to away agent', async () => {
			const roomInfoResp = await api.get(`/livechat/rooms`);
			const roomBody = await roomInfoResp.json();
			const room = roomBody.rooms.find((room: IRoom) => room.fname === visitor.name);

			expect(room.servedBy._id).toBe(awayAgent.data._id);
			expect(room.departmentId).toBe(forwardToOfflineDepartment.data._id);
		});
	});
});
