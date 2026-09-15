import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { Authenticated, Login } from './page-objects';
import { Listbox } from './page-objects/fragments/listbox';
import { expectPollUserStatus } from './utils/expectPollUserStatus';
import { expect, test } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

const getStatusAsViewer = async (viewerApi: APIRequestContext, username: string): Promise<string | undefined> => {
	const response = await viewerApi.get('/users.info', { params: { username } });
	const body = await response.json();
	return body.user?.status;
};

test.describe('Admin > Status and presence > User status', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.admin.state });

	let hiddenUser: ITestUser;
	let blockedViewer: ITestUser;
	let controlViewer: ITestUser;
	let hiddenUserContext: BrowserContext;
	let hiddenUserPage: Page;

	test.beforeAll(async ({ api, browser }) => {
		hiddenUser = await createTestUser(api);
		blockedViewer = await createTestUser(api);
		controlViewer = await createTestUser(api);

		hiddenUserContext = await browser.newContext();
		hiddenUserPage = await hiddenUserContext.newPage();

		await hiddenUserPage.goto('/login');
		await new Login(hiddenUserPage).login(hiddenUser.data.username, DEFAULT_USER_CREDENTIALS.password);
		await new Authenticated(hiddenUserPage).waitForDisplay();

		await expectPollUserStatus(api, hiddenUser.data.username, 'online');
	});

	test.afterAll(async () => {
		await hiddenUserPage.close();
		await hiddenUserContext.close();
		await hiddenUser.delete();
		await blockedViewer.delete();
		await controlViewer.delete();
	});

	test('hides a user from a named viewer and restores it through the confirmation modal', async ({ page, api }) => {
		const listbox = new Listbox(page);
		const row = page.locator('tr', { hasText: hiddenUser.data.name || hiddenUser.data.username }).first();
		const asBlockedViewer = await api.login({ username: blockedViewer.data.username, password: DEFAULT_USER_CREDENTIALS.password });

		await test.step('open Status and presence > User status', async () => {
			await page.goto('/admin/user-status');
			await page.getByRole('tab', { name: 'User status', exact: true }).click();
		});

		await test.step('create a rule hiding the user from the blocked viewer', async () => {
			await page.getByRole('button', { name: 'Manage user status', exact: true }).click();

			const dialog = page.getByRole('dialog', { name: 'Manage user status' });
			await expect(dialog).toBeVisible();

			await dialog.getByRole('combobox', { name: 'User', exact: true }).pressSequentially(hiddenUser.data.username);
			await listbox.selectOption(hiddenUser.data.username);

			await dialog.getByLabel('Hide status from', { exact: true }).getByRole('textbox').fill(blockedViewer.data.username);
			await listbox.selectOption(blockedViewer.data.username);

			await dialog.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(dialog).not.toBeVisible();
		});

		await test.step('the table lists the new rule', async () => {
			await expect(row).toContainText(blockedViewer.data.username);
		});

		await test.step('the blocked viewer sees the user as offline while the control viewer sees the real status', async () => {
			const asControlViewer = await api.login({ username: controlViewer.data.username, password: DEFAULT_USER_CREDENTIALS.password });

			await expect.poll(async () => getStatusAsViewer(asBlockedViewer, hiddenUser.data.username)).toBe('offline');
			await expect.poll(async () => getStatusAsViewer(asControlViewer, hiddenUser.data.username)).toBe('online');
		});

		await test.step('the admin removes the rule through the confirmation modal', async () => {
			await row.click();

			const editDialog = page.getByRole('dialog', { name: 'Manage user status' });
			await expect(editDialog).toBeVisible();
			await editDialog.getByRole('button', { name: 'Remove user status settings', exact: true }).click();

			const confirmModal = page.getByRole('dialog', { name: 'Remove user status settings' });
			await confirmModal.getByRole('button', { name: 'Remove', exact: true }).click();

			await expect(confirmModal).not.toBeVisible();
			await expect(editDialog).not.toBeVisible();
		});

		await test.step('the blocked viewer sees the real status again', async () => {
			await expect.poll(async () => getStatusAsViewer(asBlockedViewer, hiddenUser.data.username)).toBe('online');
		});
	});
});
