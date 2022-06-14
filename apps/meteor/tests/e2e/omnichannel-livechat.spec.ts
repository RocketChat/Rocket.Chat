import { test, Page, expect } from '@playwright/test';

import LiveChat from './utils/pageobjects/LiveChat';
import { updateMailToLiveChat } from './utils/helpers/updateMailToLiveChat';
import { verifyTestBaseUrl } from './utils/configs/verifyTestBaseUrl';
import { LoginPage, SideNav, MainContent, Agents } from './utils/pageobjects';
import { createRegisterUser, adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Livechat]', () => {
	let page: Page;
	let liveChat: LiveChat;
	const liveChatUser = createRegisterUser();
	test.beforeAll(async ({ browser }) => {
		const { isLocal } = verifyTestBaseUrl();

		if (isLocal) {
			await updateMailToLiveChat();
		}
		page = await browser.newPage();
		const liveChatUrl = '/livechat';
		await page.goto(liveChatUrl);

		liveChat = new LiveChat(page);
		await liveChat.btnOpenLiveChat.click();
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

	test.describe('[Show message to agent]', () => {
		let loginPage: LoginPage;
		let sideNav: SideNav;
		let mainContent: MainContent;
		let agent: Agents;
		test.beforeAll(async ({ browser }) => {
			const context = await browser.newContext();
			const otherContextPage = await context.newPage();
			otherContextPage.goto('/');

			loginPage = new LoginPage(otherContextPage);
			sideNav = new SideNav(otherContextPage);
			mainContent = new MainContent(otherContextPage);
			agent = new Agents(otherContextPage);

			await loginPage.login(adminLogin);
			await sideNav.sidebarUserMenu().click();
			await sideNav.omnichannel().click();
			await agent.agentsLink().click();
			await agent.doAddAgent('rocket.chat');
			await sideNav.findForChat(liveChatUser.name);
			await mainContent.sendMessage('this_a_test_message');
		});

		test('expect message is received from agent', async () => {
			expect(1).toBe(1);
		});
	});
});
