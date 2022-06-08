import { test, Page } from '@playwright/test';

import LiveChat from './utils/pageobjects/LiveChat';
import { updateMailToLiveChat } from './utils/helpers/updateMailToLiveChat';
import { verifyTestBaseUrl } from './utils/configs/verifyTestBaseUrl';

test.describe.only('[Department]', () => {
	let page: Page;
	let liveChat: LiveChat;
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

	test.describe('[Render]', async () => {
		test('expect show all inputs', async () => {
			await liveChat.renderAllElements();
		});
	});

	test.describe('[Actions]', async () => {
		test('expect send message to live chat', async () => {
			await liveChat.doSendMessage();
		});
	});
});
