import { faker } from '@faker-js/faker';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { AccountProfile, HomeChannel, Login } from './page-objects';
import { test, expect } from './utils/test';

test.describe.serial('Presence', () => {
	let poLogin: Login;
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;

	test.beforeEach(async ({ page }) => {
		poLogin = new Login(page);
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);

		await page.goto('/home');
	});

	test.describe('Login using default settings', () => {
		test('should user be online after log in', async () => {
			await poLogin.login('user1', DEFAULT_USER_CREDENTIALS.password);

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

		test('should not save custom status as `undefined` if nothing changes', async ({ page }) => {
			await test.step('change to empty status', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus();
				expect(await page.evaluate(() => localStorage.getItem('fuselage-localStorage-Local_Custom_Status'))).not.toBe('undefined');
			});
			await test.step('save without changes', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus();
				expect(await page.evaluate(() => localStorage.getItem('fuselage-localStorage-Local_Custom_Status'))).not.toBe('undefined');
			});
		});

		test('should show both Custom Status action and active status row when a custom status is set', async ({ page }) => {
			const text = faker.string.alpha(8);

			await test.step('Custom Status entry visible while no status is set', async () => {
				await poHomeChannel.navbar.btnUserMenu.click();
				await expect(poHomeChannel.navbar.btnCustomStatus).toBeVisible();
				await page.keyboard.press('Escape');
			});

			await test.step('after setting a status, Custom Status entry stays visible alongside the active row', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus(text);
				await poHomeChannel.navbar.btnUserMenu.click();
				await expect(poHomeChannel.navbar.btnCustomStatus).toBeVisible();
				await expect(poHomeChannel.navbar.userMenu).toContainText(text);
				await page.keyboard.press('Escape');
			});

			await test.step('cleanup', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus('');
			});
		});
	});

	test.describe('Status expiration', () => {
		test.use({ storageState: Users.admin.state });

		test('should toggle custom date/time inputs when selecting duration', async () => {
			await poHomeChannel.navbar.openEditStatusModal();

			const { editStatusModal } = poHomeChannel.navbar;

			await editStatusModal.selectDuration('Choose date and time');
			await expect(editStatusModal.customDateInput).toBeVisible();
			await expect(editStatusModal.customTimeInput).toBeVisible();

			await editStatusModal.selectDuration("Don't clear");
			await expect(editStatusModal.customDateInput).not.toBeVisible();
			await expect(editStatusModal.customTimeInput).not.toBeVisible();

			await editStatusModal.close();
		});

		test('should reject custom expiration in the past', async () => {
			await poHomeChannel.navbar.openEditStatusModal();

			const { editStatusModal } = poHomeChannel.navbar;

			await editStatusModal.selectDuration('Choose date and time');

			const today = new Date().toLocaleDateString('en-CA');

			await editStatusModal.customDateInput.fill(today);
			await editStatusModal.customTimeInput.fill('00:00');
			await editStatusModal.btnSubmit.click();

			await expect(editStatusModal.durationError).toBeVisible();
			await editStatusModal.close();
		});

		test('should reject custom expiration when date/time is missing', async () => {
			await poHomeChannel.navbar.openEditStatusModal();

			const { editStatusModal } = poHomeChannel.navbar;

			await editStatusModal.selectDuration('Choose date and time');
			await editStatusModal.customDateInput.fill('');
			await editStatusModal.btnSubmit.click();

			await expect(editStatusModal.durationMissingError).toBeVisible();
			await editStatusModal.close();
		});

		test('should set status with custom date/time expiration', async ({ page }) => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const dateStr = tomorrow.toLocaleDateString('en-CA');
			const timeStr = '12:00';

			await test.step('set status with custom expiration', async () => {
				await poHomeChannel.navbar.changeUserCustomStatusWithExpiration({
					message: 'custom deadline',
					duration: 'Choose date and time',
					customDate: dateStr,
					customTime: timeStr,
				});
			});

			await test.step('verify expiration is displayed in user menu', async () => {
				await poHomeChannel.navbar.btnUserMenu.click();
				await expect(poHomeChannel.navbar.userMenu).toContainText('custom deadline');
				await expect(poHomeChannel.navbar.userMenu).toContainText('Until');
				await page.keyboard.press('Escape');
			});

			await test.step('clear status', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus('');
			});
		});

		test('should set status with expiration, show it, and clear it', async ({ page }) => {
			await test.step('set busy status with 30-minute expiration', async () => {
				await poHomeChannel.navbar.changeUserCustomStatusWithExpiration({
					message: 'focus time',
					statusType: 'Busy',
					duration: '30 minutes',
				});
			});

			await test.step('verify expiration is displayed in user menu', async () => {
				await poHomeChannel.navbar.btnUserMenu.click();
				await expect(poHomeChannel.navbar.userMenu).toContainText('focus time');
				await expect(poHomeChannel.navbar.userMenu).toContainText('Until');
				await page.keyboard.press('Escape');
			});

			await test.step('clear status and verify expiration is removed', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus('');

				await poHomeChannel.navbar.btnUserMenu.click();
				await expect(poHomeChannel.navbar.userMenu).not.toContainText('Until');
				await expect(poHomeChannel.navbar.userMenu).not.toContainText('focus time');
			});
		});
	});

	test.describe('Status set from account profile', () => {
		test.use({ storageState: Users.admin.state });

		test('should save status with expiration from the profile form and surface it in the user menu', async ({ page }) => {
			const text = faker.string.alpha(10);

			await test.step('fill Status field + Clear-after on /account/profile and save', async () => {
				await page.goto('/account/profile');
				await poAccountProfile.inputStatusText.fill(text);
				await poAccountProfile.chooseClearStatusAfter('30 minutes');
				await Promise.all([
					page.waitForResponse((r) => r.url().endsWith('/v1/users.setStatus') && r.ok()),
					page.waitForResponse((r) => r.url().endsWith('/v1/users.updateOwnBasicInfo') && r.ok()),
					poAccountProfile.btnSaveChanges.click(),
				]);
				await expect(page.getByText('Profile saved successfully')).toBeVisible();
			});

			await test.step('status with expiration appears in user menu', async () => {
				await page.goto('/home');
				await poHomeChannel.navbar.btnUserMenu.click();
				await expect(poHomeChannel.navbar.userMenu).toContainText(text);
				await expect(poHomeChannel.navbar.userMenu).toContainText('Until');
				await page.keyboard.press('Escape');
			});

			await test.step('cleanup', async () => {
				await poHomeChannel.navbar.changeUserCustomStatus('');
			});
		});
	});
});
