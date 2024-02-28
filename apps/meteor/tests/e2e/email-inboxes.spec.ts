import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { AdminEmailInboxes, Utils } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('email-inboxes', () => {
	let poAdminEmailInboxes: AdminEmailInboxes;
	let poUtils: Utils;

	const email = faker.internet.email();

	test.beforeEach(async ({ page }) => {
		poAdminEmailInboxes = new AdminEmailInboxes(page);
		poUtils = new Utils(page);

		await page.goto('/admin/email-inboxes');
	});

	test('expect create an email inbox', async () => {
		await poAdminEmailInboxes.btnNewEmailInbox.click();
		const name = faker.person.firstName();
		await poAdminEmailInboxes.inputName.type(name);
		await poAdminEmailInboxes.inputEmail.type(email);

		// SMTP
		await poAdminEmailInboxes.inputSmtpServer.type(faker.internet.domainName());
		await poAdminEmailInboxes.inputSmtpUsername.type(faker.internet.userName());
		await poAdminEmailInboxes.inputSmtpPassword.type(faker.internet.password());
		await poAdminEmailInboxes.inputSmtpSecure.click();

		// IMAP
		await poAdminEmailInboxes.inputImapServer.type(faker.internet.domainName());
		await poAdminEmailInboxes.inputImapUsername.type(faker.internet.userName());
		await poAdminEmailInboxes.inputImapPassword.type(faker.internet.password());
		await poAdminEmailInboxes.inputImapSecure.click();

		await poAdminEmailInboxes.btnSave.click();

		await expect(poAdminEmailInboxes.itemRow(name)).toBeVisible();
	});

	test('expect delete an email inbox', async () => {
		await poAdminEmailInboxes.itemRow(email).click();
		await poAdminEmailInboxes.btnDelete.click();
		await poUtils.btnModalConfirmDelete.click();
		await expect(poUtils.toastBarSuccess).toBeVisible();
	});
});
