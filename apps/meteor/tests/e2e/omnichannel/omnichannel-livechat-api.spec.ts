import { faker } from '@faker-js/faker';
import type { Frame, Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { test, expect } from '../utils/test';

const newUser = {
	name: `${faker.person.firstName()} ${faker.string.uuid()}}`,
	email: faker.internet.email(),
};
test.describe('Omnichannel - Livechat API', () => {
	test.describe('Basic Widget Interactions', () => {
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChat;
		let page: Page;

		let frame: Frame | null;

		test.beforeAll(async ({ browser, api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			await expect(statusCode).toBe(200);

			page = await browser.newPage();
			frame = page.frame({ url: 'http://localhost:3000/livechat' });
			poLiveChat = new OmnichannelLiveChat(page, api);

			const { page: pageCtx } = await createAuxContext(browser, Users.user1);
			poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async ({ api }) => {
			await api.delete('/livechat/users/agent/user1');
			await poAuxContext.page.close();
			await page.close();
		});

		test('Open and Close widget', async () => {
			await test.step('Expect widget to be visible after maximizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();
			});
		});

	});
});
