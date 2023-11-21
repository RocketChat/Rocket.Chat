import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { test, expect } from '../utils/test';

// clearBusinessUnit
// clearDepartment
// hideWidget
// initialize
// maximizeWidget
// minimizeWidget
// onAgentStatusChange
// onAssignAgent
// onChatEnded
// onChatMaximized
// onChatMinimized
// onChatStarted
// onOfflineFormSubmit
// onPrechatFormSubmit
// onQueuePositionChange
// onServiceOffline
// onWidgetHidden
// onWidgetShown
// pageVisited
// registerGuest
// setAgent
// setBusinessUnit
// setCustomField
// setDepartment
// setGuestEmail
// setGuestName
// setGuestToken
// setLanguage
// setParentUrl
// setTheme
// showWidget

test.describe('Omnichannel - Livechat API', () => {
	test.describe('Basic Widget Interactions', () => {
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChat;
		let page: Page;

		test.beforeAll(async ({ browser, api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			await expect(statusCode).toBe(200);

			page = await browser.newPage();
			await expect((await api.post('/settings/Enable_CSP', { value: false })).status()).toBe(200);

			poLiveChat = new OmnichannelLiveChat(page, api);

			const { page: pageCtx } = await createAuxContext(browser, Users.user1);
			poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async ({ api }) => {
			// await expect((await api.post('/settings/Enable_CSP', { value: true })).status()).toBe(200);
			await api.delete('/livechat/users/agent/user1');
			await poAuxContext.page.close();
			await page.close();
		});

		test('Open and Close widget', async () => {
			await test.step('Expect widget to be visible after maximizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();
			});

			await test.step('Expect widget not be visible after minimizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.minimizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();
			});
		});

		test('Show and Hide widget', async () => {
			await test.step('Expect livechat button not be visible after minimizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.hideWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByRole('button', { name: 'Rocket.Chat' })).not.toBeVisible();
			});

			await test.step('Expect livechat button to be visible after show()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.showWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByRole('button', { name: 'Rocket.Chat' })).toBeVisible();
			});
		});

		test.skip('setAgent', async () => {
			// Set agent does not actually set the agent, it just sets the default agent on the widget state
			// Maybe that is used in an integration? Since as it is now, when the user starts a chat, the agent will be overriden
			// TODO: Find the use case of the setAgent method
			await test.step('Expect setAgent to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setAgent({ username: 'user1', _id: 'user1' }));
			});
		});

		test('setLanguage', async () => {

			await test.step('Expect language to be pt-BR', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setLanguage('pt-BR'));

				await expect(
					page.frameLocator('#rocketchat-iframe').getByText('Por favor, nos passe algumas informações antes de iniciar o chat'),
				).toBeVisible();
			});

			await test.step('Expect language to be en', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setLanguage('en'));

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Please, tell us some information to start the chat')).toBeVisible();
			});
		});

	});
});
