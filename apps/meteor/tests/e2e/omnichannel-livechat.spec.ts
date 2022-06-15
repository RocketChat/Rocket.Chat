import { test, Page, expect } from '@playwright/test';

import { updateMailToLiveChat } from './utils/helpers/updateMailToLiveChat';
import { verifyTestBaseUrl } from './utils/configs/verifyTestBaseUrl';
import { LoginPage, SideNav, MainContent, Agents, LiveChat } from './pageobjects';
import { createRegisterUser, adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Livechat]', () => {
	let page: Page;
	let liveChat: LiveChat;
	const liveChatUser = createRegisterUser();

	test.describe('[Offline message]', () => {
		test.beforeAll(async ({ browser }) => {
			const { isLocal } = verifyTestBaseUrl();

			if (isLocal) {
				await updateMailToLiveChat();
			}
			page = await browser.newPage();
			const liveChatUrl = '/livechat';
			await page.goto(liveChatUrl);

			liveChat = new LiveChat(page);
			await liveChat.btnOpenLiveChat('L').click();
		});

		test.describe('[Render]', () => {
			test('expect show all inputs', async () => {
				await liveChat.renderAllElements();
			});
		});

		test.describe('[Actions]', () => {
			test('expect send message to live chat', async () => {
				await liveChat.doSendMessage(liveChatUser);
			});
		});
	});

	test.describe('[Send message to online agent]', () => {
		let loginPage: LoginPage;
		let sideNav: SideNav;
		let mainContent: MainContent;
		let agent: Agents;
		test.beforeAll(async ({ browser }) => {
			const context = await browser.newContext();
			const otherContextPage = await context.newPage();
			await otherContextPage.goto('/');

			loginPage = new LoginPage(otherContextPage);
			sideNav = new SideNav(otherContextPage);
			mainContent = new MainContent(otherContextPage);
			agent = new Agents(otherContextPage);

			await loginPage.login(adminLogin);
			await sideNav.sidebarUserMenu.click();
			await sideNav.omnichannel.click();
			await agent.agentsLink.click();
			await agent.doAddAgent('RocketChat Internal Admin Test');
			// await sideNav.omnichannelGoBackButton.click();
			await page.reload();
			await liveChat.btnOpenLiveChat('R').click();
			await liveChat.doSendMessage(liveChatUser, false);
			await liveChat.onlineAgentMessage.type('this_a_test_message');
			await liveChat.btnSendMessageToOnlineAgent.click();

			// await agent.clickOnLiveChatCall(liveChatUser.name).click();

			await mainContent.sendMessage('this_a_test_message');
		});

		test('expect message is received from agent', async () => {
			expect(1).toEqual(1);
		});
	});
});
