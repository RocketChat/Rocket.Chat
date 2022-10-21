import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { AdminEmailInboxes, Utils } from './page-objects';

test.use({ storageState: 'admin-session.json' });

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
		await poAdminEmailInboxes.inputName.type(faker.name.firstName());
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

		expect(poUtils.toastBarSuccess).toBeVisible();
	});

	test('expect delete an email inbox', async () => {
		await poAdminEmailInboxes.findEmailInbox(email).click();
		await poAdminEmailInboxes.btnDelete.click();
		await poUtils.btnModalConfirmDelete.click();
		expect(poUtils.toastBarSuccess).toBeVisible();
	});
});
