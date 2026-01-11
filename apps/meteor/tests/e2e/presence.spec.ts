import { faker } from '@faker-js/faker';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { Registration, HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.describe.serial('Presence', () => {
	let poRegistration: Registration;
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.describe('Login using default settings', () => {
		test('should user be online after log in', async () => {
			await poRegistration.username.fill('user1');
			await poRegistration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(poHomeChannel.navbar.btnUserMenu).toBeVisible();
		});
	});

	test.describe('Custom status', () => {
		const customStatus = faker.string.alpha(10);
		test.use({ storageState: Users.admin.state });

		test('should user custom status be reactive', async ({ browser }) => {
			await test.step('user1 custom status should be empty', async () => {
				await poHomeChannel.navbar.openChat('user1');

				await expect(poHomeChannel.content.channelHeader).not.toContainText(customStatus);
			});

			await test.step('update user1 custom status', async () => {
				const user1Page = await browser.newPage({ storageState: Users.user1.state });
				await user1Page.goto('/home');
				const user1Channel = new HomeChannel(user1Page);

				await user1Channel.navbar.changeUserCustomStatus(customStatus);
				await user1Page.close();
			});

			await test.step('should user1 custom status be updated', async () => {
				await poHomeChannel.navbar.openChat('user1');

				await expect(poHomeChannel.content.channelHeader).toContainText(customStatus);
			});
		});

		test('should be able to erase custom status', async ({ page }) => {
			await poHomeChannel.navbar.changeUserCustomStatus(customStatus);
			await poHomeChannel.navbar.btnUserMenu.click();
			await expect(poHomeChannel.navbar.userMenu).toContainText(customStatus);
			await page.keyboard.press('Escape');

			await poHomeChannel.navbar.changeUserCustomStatus('');

			await poHomeChannel.navbar.btnUserMenu.click();
			await expect(async () => expect(poHomeChannel.navbar.userMenu).not.toContainText(customStatus)).toPass();
		});
	});
});
