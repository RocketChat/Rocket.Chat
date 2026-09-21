import type { APIRequestContext, Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { AdminStatusAndPresence } from './page-objects';
import { expectPollUserStatus } from './utils/expectPollUserStatus';
import { getUserStatusAsViewer } from './utils/getUserStatusAsViewer';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser, loginTestUser } from './utils/user-helpers';

test.describe('Admin > Status and presence > User status', () => {
	test.skip(!IS_EE);
	test.use({ storageState: Users.admin.state });

	preserveSettings(['Accounts_StatusVisibility_Admin_Enabled']);

	let hiddenUser: ITestUser;
	let blockedViewer: ITestUser;
	let controlViewer: ITestUser;
	let hiddenUserPage: Page;
	let asBlockedViewer: APIRequestContext;
	let asControlViewer: APIRequestContext;

	test.beforeAll(async ({ api, browser }) => {
		await setSettingValueById(api, 'Accounts_StatusVisibility_Admin_Enabled', true);

		hiddenUser = await createTestUser(api);
		blockedViewer = await createTestUser(api);
		controlViewer = await createTestUser(api);

		({ page: hiddenUserPage } = await createAuxContext(browser, await loginTestUser(api, hiddenUser)));
		asBlockedViewer = await api.login({ username: blockedViewer.data.username, password: DEFAULT_USER_CREDENTIALS.password });
		asControlViewer = await api.login({ username: controlViewer.data.username, password: DEFAULT_USER_CREDENTIALS.password });

		await expectPollUserStatus(api, hiddenUser.data.username, 'online');
	});

	test.afterAll(async () => {
		await asBlockedViewer.dispose();
		await asControlViewer.dispose();
		await hiddenUserPage.close();
		await hiddenUser.delete();
		await blockedViewer.delete();
		await controlViewer.delete();
	});

	test('hides a user from a named viewer and restores it through the confirmation modal', async ({ page }) => {
		const admin = new AdminStatusAndPresence(page);
		const { listbox } = admin;
		const row = admin.rowOf(hiddenUser.data.name || hiddenUser.data.username);

		await test.step('open Status and presence > User status', async () => {
			await admin.goto();
			await admin.openUserStatusTab();
		});

		await test.step('create a rule hiding the user from the blocked viewer', async () => {
			await admin.openEditor();

			const dialog = admin.editor;

			await dialog.getByRole('textbox', { name: 'User', exact: true }).pressSequentially(hiddenUser.data.username);
			await listbox.selectOption(hiddenUser.data.name || hiddenUser.data.username);

			await dialog.getByRole('combobox', { name: 'Select users', exact: true }).pressSequentially(blockedViewer.data.username);
			await listbox.selectOption(blockedViewer.data.username);
			await page.keyboard.press('Tab');

			await dialog.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(dialog).not.toBeVisible();
		});

		await test.step('the table lists the new rule', async () => {
			await expect(row).toContainText(blockedViewer.data.username);
		});

		await test.step('the blocked viewer sees the user as offline while the control viewer sees the real status', async () => {
			await expect.poll(async () => getUserStatusAsViewer(asBlockedViewer, hiddenUser.data.username)).toBe('offline');
			await expect.poll(async () => getUserStatusAsViewer(asControlViewer, hiddenUser.data.username)).toBe('online');
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
			await expect.poll(async () => getUserStatusAsViewer(asBlockedViewer, hiddenUser.data.username)).toBe('online');
		});
	});
});
