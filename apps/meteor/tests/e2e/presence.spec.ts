import { DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe.serial('Presence', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', true)).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', true)).status()).toBe(200);
	});

	test.describe('Login using default settings', () => {
		test('expect user to be online after log in', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
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
