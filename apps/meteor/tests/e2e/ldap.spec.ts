import path from 'path';

<<<<<<< HEAD
import type { StartedTestContainer } from 'testcontainers';
import { GenericContainer } from 'testcontainers';

import { expect, test } from './utils/test';
import { AdminLdap } from './page-objects/admin-ldap';

test.use({ storageState: 'admin-session.json' });
test.describe('ldap test', async () => {
	let container: StartedTestContainer;
	const ldapConnectionUrl = '/admin/settings/LDAP';

	let poAdminLdap: AdminLdap;
=======
import { test, expect } from '@playwright/test';
import type { StartedTestContainer } from 'testcontainers';
import { GenericContainer } from 'testcontainers';

test.describe.only('ldap test', async () => {
	let container: StartedTestContainer;
>>>>>>> develop
	test.beforeAll(async () => {
		const buildContext = path.resolve(__dirname, 'fixtures', 'ldap-client');

		container = await (await GenericContainer.fromDockerfile(buildContext).build())
<<<<<<< HEAD
			.withName('ldap-test')
=======
			.withName('ldap')
>>>>>>> develop
			.withExposedPorts({ container: 10389, host: 389 })
			.start();
	});

	test.afterAll(async () => {
		await container.stop();
	});

<<<<<<< HEAD
	test.beforeEach(async ({ page }) => {
		poAdminLdap = new AdminLdap(page);
	});

	test('expect connection is ok', async ({ page }) => {
		await page.goto(ldapConnectionUrl);
		const isChecked = await poAdminLdap.ldapConnection.inputCheck.isChecked();
		// FIXME: why is possible verify connection with reload in page
		if (!isChecked) {
			await poAdminLdap.ldapConnection.btnEnable.click();
			await poAdminLdap.ldapConnection.selectLdapServerType();
			await poAdminLdap.ldapConnection.inputLdapHost.fill('localhost');
			await poAdminLdap.ldapConnection.btnLdapReconnect.click();
			await poAdminLdap.ldapConnection.btnLoginFallBack.click();
			await poAdminLdap.ldapConnection.btnSaveChanges.click();

			await page.reload();
		}

		await poAdminLdap.ldapConnection.btnTestConnection.click();
		await expect(poAdminLdap.toastSuccess).toBeVisible();
=======
	test('something testing', async ({ page }) => {
		await page.goto('/');
		await page.pause();
		console.log(container);
		expect(1).toEqual(1);
>>>>>>> develop
	});
});
