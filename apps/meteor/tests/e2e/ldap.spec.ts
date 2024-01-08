import path from 'path';

import { v2 as compose } from 'docker-compose'

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { AdminLdap } from './page-objects/admin-ldap';
import { removeDockerImage } from './utils/removeDockerImage';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.skip(!IS_EE, 'LDAP > Enterprise Only');
test.use({ storageState: Users.admin.state });
test.describe('ldap test', async () => {
	const ldapConnectionUrl = '/admin/settings/LDAP';
	const containerPath = path.resolve(__dirname, 'containers', 'ldap_client');

	let poAdminLdap: AdminLdap;
	test.beforeAll(async ({ api }) => {
		await compose.buildOne('ldap_client', {
			cwd: containerPath,
		});

		await compose.upOne('ldap_client', {
			cwd: containerPath,
		});

		await expect((await setSettingValueById(api, 'LDAP_Enable', true)).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await compose.down({
			cwd: containerPath,
		});

		removeDockerImage('ldap_client', containerPath);

		await setSettingValueById(api, 'LDAP_Enable', false);
	});

	test.beforeEach(async ({ page }) => {
		poAdminLdap = new AdminLdap(page);
	});

	test('expect connection is ok', async ({ page }) => {
		await page.goto(ldapConnectionUrl);

		await poAdminLdap.ldapConnection.btnTestConnection.click();
		await expect(poAdminLdap.toastSuccess).toBeVisible();
	});
});
