import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Routing to Idle Agents', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLivechat: OmnichannelLiveChat;

	let livechatPage: Page;

	let agent: Awaited<ReturnType<typeof createAgent>>;
	let testDepartment: Awaited<ReturnType<typeof createDepartment>>;
	let visitor: { name: string; email: string };

	const routingMethods = ['Auto_Selection', 'Load_Balancing', 'Load_Rotation'];

	test.beforeAll(async ({ api }) => {
		[agent, testDepartment] = await Promise.all([
			createAgent(api, 'user1'),
			createDepartment(api, { name: 'Idle Routing Dept' }),
			setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300),
			expect(await setSettingValueById(api, 'Omnichannel_enable_department_removal', true)).toBeOK(),
		]);

		await Promise.all([addAgentToDepartment(api, { department: testDepartment.data, agentId: 'user1' })]);
	});

	test.beforeEach(async ({ page, browser, api }) => {
		visitor = createFakeVisitor();
		poHomeOmnichannel = new HomeOmnichannel(page);
		await page.goto('/');
		await page.locator('#main-content').waitFor();

		({ page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false));
		poLivechat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.afterEach(async ({ api }) => {
		if (livechatPage) {
			await livechatPage.context().close();
		}

		await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			testDepartment.delete(),
			agent.delete(),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false),
			expect(await setSettingValueById(api, 'Omnichannel_enable_department_removal', false)).toBeOK(),
		]);
	});

	routingMethods.forEach((routingMethod) => {
		test.describe(`Routing method: ${routingMethod}`, () => {
			test(`should not route to idle agents`, async ({ api }) => {
				await test.step(`Setup routing method to ${routingMethod} and ignore idle agents`, async () => {
					await setSettingValueById(api, 'Livechat_Routing_Method', routingMethod);
					await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false);
				});

				await test.step('Visitor tries to initiate a conversation with the away agent', async () => {
					await poLivechat.page.reload();
					await poLivechat.openAnyLiveChat();
					await poLivechat.sendMessage(visitor, false);
					await poLivechat.onlineAgentMessage.fill('Hello from visitor');

					// Force Agent to become away by idle timeout
					await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1);
					await poHomeOmnichannel.page.reload();
					await expect(poHomeOmnichannel.navbar.getUserStatusBadge('away')).toBeVisible();

					await poLivechat.btnSendMessageToOnlineAgent.click();
				});

				await test.step('Verify visitor is not taken by agent', async () => {
					await expect(
						poLivechat.alertMessage('Error starting a new conversation: Sorry, no online agents [no-agent-online]'),
					).toBeVisible();
				});
			});

			test(`should route to agents even if they are idle when setting is enabled`, async ({ api }) => {
				await test.step(`Setup routing method to ${routingMethod} and allow idle agents`, async () => {
					await setSettingValueById(api, 'Livechat_Routing_Method', routingMethod);
					await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', true);
				});

				await test.step('Force agent to become away by idle timeout', async () => {
					await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1);
					await poHomeOmnichannel.page.reload();
					await expect(poHomeOmnichannel.navbar.getUserStatusBadge('away')).toBeVisible();
				});

				await test.step('Visitor initiates chat', async () => {
					await poLivechat.page.reload();
					await poLivechat.openAnyLiveChat();
					await poLivechat.sendMessage(visitor, false);
					await poLivechat.onlineAgentMessage.fill('test message');
					await poLivechat.btnSendMessageToOnlineAgent.click();
				});

				await test.step('Verify chat is served to an agent', async () => {
					await expect(poLivechat.headerTitle).toHaveText(agent.data.username);
				});
			});
		});
	});
});
