import { DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { Registration, HomeChannel } from './page-objects';
import { Modal } from './page-objects/modal';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe.serial('Presence', () => {
	let poRegistration: Registration;
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', true)).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', true)).status()).toBe(200);
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

	test.describe('Login using with "Methods by REST" disabled', () => {
		test.skip(IS_EE, `Micro services don't support turning this setting off`);

		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', false)).status()).toBe(200);
		});

		test('expect user to be online after log in', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
		});
	});

	// This test is supposed to be ran locally because it is too slow.
	// It is also a workaround until we find a better way to test this.
	test.describe.skip('Calendar appointment automatic status', () => {
		test.describe.configure({ timeout: 1000 * 60 * 10 });
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Calendar_BusyStatus_Enabled', true);
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Calendar_BusyStatus_Enabled', false);
		});

		test('Should change user status to busy when there is an appointment', async ({ page, api }) => {
			await page.goto('/home');

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
			expect(
				(
					await api.post('/calendar-events.create', {
						startTime: new Date(new Date().getTime() + 1000 * 60 * 2).toISOString(),
						endTime: new Date(new Date().getTime() + 1000 * 60 * 3).toISOString(),
						subject: 'Test appointment',
						description: 'Test appointment description',
						meetingUrl: 'https://rocket.chat/',
					})
				).status(),
			).toBe(200);

			await test.step('Should change status to busy', async () => {
				// wait 2 minutes to ensure the status is changed
				await page.waitForTimeout(1000 * 60 * 2);

				await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--busy')).toBeVisible();
			});

			await test.step('Should revert status to online', async () => {
				// wait 2 minutes to ensure the status is changed
				await page.waitForTimeout(1000 * 60);

				await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
			});
		});

		test('Should not change status to busy if the event is deleted', async ({ page, api }) => {
			await page.goto('/home');

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();

			const apiResponse = await api.post('/calendar-events.create', {
				startTime: new Date(new Date().getTime() + 1000 * 60 * 2).toISOString(),
				endTime: new Date(new Date().getTime() + 1000 * 60 * 3).toISOString(),
				subject: 'Test appointment',
				description: 'Test appointment description',
				meetingUrl: 'https://rocket.chat/',
			});

			expect(apiResponse.status()).toBe(200);

			const eventId = (await apiResponse.json()).id;

			expect((await api.post('/calendar-events.delete', { eventId })).status()).toBe(200);

			await page.waitForTimeout(1000 * 60 * 2);

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
		});

		test('Should update status to busy when the event is updated', async ({ page, api }) => {
			await page.goto('/home');

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();

			const apiResponse = await api.post('/calendar-events.create', {
				startTime: new Date(new Date().getTime() + 1000 * 60 * 50).toISOString(),
				endTime: new Date(new Date().getTime() + 1000 * 60 * 55).toISOString(),
				subject: 'Test appointment',
				description: 'Test appointment description',
				meetingUrl: 'https://rocket.chat/',
			});

			expect(apiResponse.status()).toBe(200);

			const eventId = (await apiResponse.json()).id;

			expect(
				(
					await api.post('/calendar-events.update', {
						eventId,
						startTime: new Date(new Date().getTime() + 1000 * 60 * 2).toISOString(),
						subject: 'Test appointment updated',
						description: 'Test appointment description updated',
						meetingUrl: 'https://rocket.chat/updated',
					})
				).status(),
			).toBe(200);

			// wait 2 minutes to ensure the status is changed
			await page.waitForTimeout(1000 * 60 * 2);

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--busy')).toBeVisible();
		});
	});
});
