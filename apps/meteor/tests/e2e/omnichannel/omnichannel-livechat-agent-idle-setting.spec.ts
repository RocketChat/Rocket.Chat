import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { setSettingValueById } from '../utils';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Routing to Idle Agents', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLivechat: OmnichannelLiveChat;

	let livechatPage: Page | undefined;

	let agent: Awaited<ReturnType<typeof createAgent>>;
	let visitor: { name: string; email: string };

	const routingMethods = ['Auto_Selection', 'Load_Balancing', 'Load_Rotation'];

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');
		await expect(agent.response).toBeOK();

		const settingResponses = await Promise.all([
			setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300),
			setSettingValueById(api, 'Omnichannel_enable_department_removal', true),
		]);

		for (const response of settingResponses) {
			await expect(response).toBeOK();
		}
	});

	test.beforeEach(async ({ page, browser, api }) => {
		visitor = createFakeVisitor();
		await expect(await makeAgentAvailable(api, agent.data._id)).toBeOK();

		poHomeOmnichannel = new HomeOmnichannel(page);
		await poHomeOmnichannel.page.goto('/');
		await poHomeOmnichannel.waitForHome();
		await expect(poHomeOmnichannel.navbar.getUserStatusBadge('online')).toBeVisible();

		({ page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false));
		poLivechat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.afterEach(async ({ api }) => {
		if (livechatPage) {
			await livechatPage.context().close();
		}

		await expect(await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 300)).toBeOK();
	});

	test.afterAll(async ({ api }) => {
		const responses = await Promise.all([
			agent.delete(),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false),
			setSettingValueById(api, 'Omnichannel_enable_department_removal', false),
		]);

		for (const response of responses) {
			await expect(response).toBeOK();
		}
	});

	routingMethods.forEach((routingMethod) => {
		test.describe(`Routing method: ${routingMethod}`, () => {
			test(`should not route to idle agents`, async ({ api }) => {
				await test.step(`Setup routing method to ${routingMethod} and ignore idle agents`, async () => {
					await expect(await setSettingValueById(api, 'Livechat_Routing_Method', routingMethod)).toBeOK();
					await expect(await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false)).toBeOK();
				});

				await test.step('Visitor tries to initiate a conversation with the away agent', async () => {
					await poLivechat.openAnyLiveChat();
					await poLivechat.sendMessage(visitor, false);
					await poLivechat.onlineAgentMessage.fill('Hello from visitor');

					// Force Agent to become away by idle timeout
					await expect(await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1)).toBeOK();
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
					await expect(await setSettingValueById(api, 'Livechat_Routing_Method', routingMethod)).toBeOK();
					await expect(await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', true)).toBeOK();
				});

				await test.step('Force agent to become away by idle timeout', async () => {
					await expect(await setSettingValueById(api, 'Accounts_Default_User_Preferences_idleTimeLimit', 1)).toBeOK();
					await poHomeOmnichannel.page.reload();
					await expect(poHomeOmnichannel.navbar.getUserStatusBadge('away')).toBeVisible();
				});

				await test.step('Visitor initiates chat', async () => {
					await poLivechat.openAnyLiveChatAndSendMessage({
						liveChatUser: visitor,
						message: 'test message',
						isOffline: false,
					});
				});

				await test.step('Verify chat is served to an agent', async () => {
					await expect(poLivechat.headerTitle).toHaveText(agent.data.username);
				});
			});
		});
	});
});
