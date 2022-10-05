import path from 'path';

import type { StartedTestContainer } from 'testcontainers';
import { GenericContainer } from 'testcontainers';

import { expect, test } from './utils/test';
import { AdminLdap } from './page-objects/admin-ldap';

test.use({ storageState: 'admin-session.json' });
test.describe('ldap test', async () => {
	let container: StartedTestContainer;
	const ldapConnectionUrl = '/admin/settings/LDAP';

	let poAdminLdap: AdminLdap;
	test.beforeEach(async () => {
		const buildContext = path.resolve(__dirname, 'fixtures', 'ldap-client');

		container = await (await GenericContainer.fromDockerfile(buildContext).build())
			.withName('ldap-test')
			.withExposedPorts({ container: 10389, host: 389 })
			.start();
	});

	test.beforeEach(async ({ page }) => {
		poAdminLdap = new AdminLdap(page);
	});

	test.afterEach(async () => {
		await container.stop();
	});

	test('expect connection is ok', async ({ page }) => {
		console.log(container);
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
	});
});
