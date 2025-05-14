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

	test('should not allow export OTR messages', async ({ browser }) => {
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

		await poHomeChannel.content.sendMessage('hello OTR');
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnExportMessages.click();
		await poHomeChannel.content.getOTRMessageByText('hello OTR').click();
		await expect(poHomeChannel.content.btnClearSelection).toBeDisabled();

		await user1Page.close();
	});

	test('should not allow edit OTR messages', async ({ browser, page }) => {
		const user1Page = await browser.newPage({ storageState: Users.user1.state });
		const user1Channel = new HomeChannel(user1Page);

		await test.step('log in user1', async () => {
			await user1Page.goto(`/direct/${Users.admin.data.username}`);
			await user1Channel.content.waitForChannel();
		});

		await test.step('send normal messages', async () => {
			await poHomeChannel.sidenav.openChat(Users.user1.data.username);
			await poHomeChannel.content.sendMessage('Normal message');
			await user1Channel.content.sendMessage('Normal message');
		});

		await test.step('invite OTR with user1', async () => {
			await poHomeChannel.tabs.kebab.click({ force: true });
			await poHomeChannel.tabs.btnEnableOTR.click({ force: true });
			await poHomeChannel.tabs.otr.btnStartOTR.click();
		});

		await test.step('accept handshake with user1', async () => {
			await user1Channel.tabs.otr.btnAcceptOTR.click();
		});

		await test.step('send OTR messages', async () => {
			await poHomeChannel.content.sendMessage('hello user1');
			await expect(poHomeChannel.content.lastUserMessage).toHaveAttribute('aria-roledescription', 'OTR message');

			await user1Channel.content.sendMessage('hello admin');
			await expect(user1Channel.content.lastUserMessage).toHaveAttribute('aria-roledescription', 'OTR message');
		});

		await test.step('not show edit message action', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await expect(poHomeChannel.content.btnOptionEditMessage).not.toBeVisible();

			await user1Channel.content.openLastMessageMenu();
			await expect(user1Channel.content.btnOptionEditMessage).not.toBeVisible();

			await page.keyboard.press('Escape');
			await user1Page.keyboard.press('Escape');
		});

		await test.step('keyboard edit action when using up arrow key should show normal messages', async () => {
			await poHomeChannel.composer.focus();
			await page.keyboard.press('ArrowUp');
			await expect(poHomeChannel.composer).toHaveValue('Normal message');
			await poHomeChannel.composer.fill('Normal message edited');
			await page.keyboard.press('Enter');
			await expect(poHomeChannel.content.nthMessage(0)).toContainText('Normal message edited');

			await user1Channel.composer.focus();
			await user1Page.keyboard.press('ArrowUp');
			await expect(user1Channel.composer).toHaveValue('Normal message');
			await user1Channel.composer.fill('Normal message edited');
			await user1Page.keyboard.press('Enter');
			await expect(user1Channel.content.nthMessage(0)).toContainText('Normal message edited');
		});

		await user1Page.close();
	});
});
