import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createDirectMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('OTR', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page, api }) => {
		await createDirectMessage(api);
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should hide export messages for rooms with OTR enabled', async ({ browser }) => {
		const user1Page = await browser.newPage({ storageState: Users.user1.state });
		const user1Channel = new HomeChannel(user1Page);

		await test.step('log in user1', async () => {
			await user1Page.goto(`/direct/${Users.admin.data.username}`);
			await user1Channel.content.waitForChannel();
		});

		await test.step('invite OTR with user1', async () => {
			await poHomeChannel.sidenav.openChat(Users.user1.data.username);
			await poHomeChannel.tabs.kebab.click({ force: true });
			await poHomeChannel.tabs.btnEnableOTR.click({ force: true });
			await poHomeChannel.tabs.otr.btnStartOTR.click();
		});

		await test.step('accept handshake with user1', async () => {
			await user1Channel.tabs.otr.btnAcceptOTR.click();
		});

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnExportMessages).not.toBeVisible();

		await user1Page.close();
	});
});
