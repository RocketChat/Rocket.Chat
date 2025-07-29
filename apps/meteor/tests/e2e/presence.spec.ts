import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { Registration, HomeChannel } from './page-objects';
import { Modal } from './page-objects/modal';
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

			await expect(poHomeChannel.sidenav.btnUserProfileMenu).toBeVisible();
		});
	});

	test.describe('Custom status', () => {
		test.use({ storageState: Users.admin.state });

		test('should user custom status be reactive', async ({ browser }) => {
			await test.step('user1 custom status should be empty', async () => {
				await poHomeChannel.sidenav.openChat('user1');

				await expect(poHomeChannel.content.channelHeader).not.toContainText('new status');
			});

			await test.step('update user1 custom status', async () => {
				const user1Page = await browser.newPage({ storageState: Users.user1.state });
				await user1Page.goto('/home');
				const user1Channel = new HomeChannel(user1Page);
				const user1Modal = new Modal(user1Page);

				await user1Channel.sidenav.btnUserProfileMenu.click();
				await user1Channel.sidenav.getUserProfileMenuOption('Custom Status').click();
				await user1Modal.getModalByName('Edit Status').getByRole('textbox', { name: 'Status message' }).fill('new status');
				await user1Modal.getModalByName('Edit Status').getByRole('button', { name: 'Save' }).click();

				await user1Page.close();
			});

			await test.step('should user1 custom status be updated', async () => {
				await poHomeChannel.sidenav.openChat('user1');

				await expect(poHomeChannel.content.channelHeader).toContainText('new status');
			});
		});
	});
});
