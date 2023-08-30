import * as constants from '../../config/constants';
import { FederationAdmin } from '../../page-objects/admin';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createChannelAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - Admin Panel - Users', () => {
	let poFederationChannelServer1: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let usernameWithDomainFromServer2: string;

	let poFederationAdmin: FederationAdmin;

	test.beforeEach(async ({ page }) => {
		poFederationAdmin = new FederationAdmin(page);
	});

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
		usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
			userFromServer2UsernameOnly,
			constants.RC_SERVER_2.matrixServerName,
		);

		const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
		const page = await browser.newPage();
		poFederationChannelServer1 = new FederationChannel(page);
		await createChannelAndInviteRemoteUserToCreateLocalUser({
			page,
			poFederationChannelServer: poFederationChannelServer1,
			fullUsernameFromServer: fullUsernameFromServer2,
			server: constants.RC_SERVER_1,
		});
	});

	test.afterAll(async ({ apiServer1, apiServer2 }) => {
		await tearDownTesting(apiServer1);
		await tearDownTesting(apiServer2);
	});

	test.beforeEach(async ({ page }) => {
		poFederationChannelServer1 = new FederationChannel(page);
		await doLogin({
			page,
			server: {
				url: constants.RC_SERVER_1.url,
				username: constants.RC_SERVER_1.username,
				password: constants.RC_SERVER_1.password,
			},
		});
		await page.goto(`${constants.RC_SERVER_1.url}/admin/users`);
	});

	test('expect to not be able to edit federated users from the admin panel', async ({ page }) => {
		await poFederationAdmin.inputSearchUsers.type(usernameWithDomainFromServer2);
		await page.locator(`table tr`).locator(`figure[data-username="${usernameWithDomainFromServer2}"]`).click();
		await expect(poFederationAdmin.tabs.users.btnEdit).toBeDisabled();
	});

	test('expect to not be able to edit federated users from the admin panel (trying to bypass by url)', async ({ page }) => {
		await poFederationAdmin.inputSearchUsers.type(usernameWithDomainFromServer2);
		await page.locator(`table tr`).locator(`figure[data-username="${usernameWithDomainFromServer2}"]`).click();
		await expect(poFederationAdmin.tabs.users.btnEdit).toBeDisabled();
		const currentUrl = await page.url();
		await page.goto(`${currentUrl.replace('info', 'edit')}`);
		await expect(page.locator('.rcx-box.rcx-box--full.rcx-callout__wrapper')).toBeVisible();
		await expect(
			page.locator('.rcx-box.rcx-box--full.rcx-callout__wrapper').locator('.rcx-box.rcx-box--full.rcx-callout__children'),
		).toContainText('Not possible to edit a federated user');
	});

	test('expect not to have the kebab menu enabled, since there should not be any menu option enabled for federated users', async ({
		page,
	}) => {
		await poFederationAdmin.inputSearchUsers.type(usernameWithDomainFromServer2);
		await page.locator(`table tr`).locator(`figure[data-username="${usernameWithDomainFromServer2}"]`).click();
		await expect(page.locator('[data-testid="menu"]')).not.toBeVisible();
	});

	test('expect to federated users (remote only) not being counted as a seat cap in an EE environment', async ({
		browser,
		page,
		apiServer2,
	}) => {
		const before = parseInt((await page.locator('role=status').textContent())?.replace('Seats Available', '').trim() || '0');
		const newUserFromServer2 = await registerUser(apiServer2);
		const page2 = await browser.newPage();
		const poFederationChannelServer1ForUser2 = new FederationChannel(page2);
		const fullUsernameFromServer2 = formatIntoFullMatrixUsername(newUserFromServer2, constants.RC_SERVER_2.matrixServerName);
		await createChannelAndInviteRemoteUserToCreateLocalUser({
			page: page2,
			poFederationChannelServer: poFederationChannelServer1ForUser2,
			fullUsernameFromServer: fullUsernameFromServer2,
			server: constants.RC_SERVER_1,
		});
		const after = parseInt((await page.locator('role=status').textContent())?.replace('Seats Available', '').trim() || '0');
		expect(before).toEqual(after);
		await page2.close();
	});

	test('expect to federated users (but local ones) being counted as a seat cap in an EE environment', async ({
		browser,
		page,
		apiServer1,
	}) => {
		const before = parseInt((await page.locator('role=status').textContent())?.replace('Seats Available', '').trim() || '0');
		const newUserFromServer1 = await registerUser(apiServer1);
		const page2 = await browser.newPage();
		const poFederationChannelServer1ForUser2 = new FederationChannel(page2);
		const fullUsernameFromServer1 = formatIntoFullMatrixUsername(newUserFromServer1, constants.RC_SERVER_1.matrixServerName);
		await createChannelAndInviteRemoteUserToCreateLocalUser({
			page: page2,
			poFederationChannelServer: poFederationChannelServer1ForUser2,
			fullUsernameFromServer: fullUsernameFromServer1,
			server: constants.RC_SERVER_1,
		});
		await page.reload();
		const after = parseInt((await page.locator('role=status').textContent())?.replace('Seats Available', '').trim() || '0');
		expect(before).not.toEqual(after);
		expect(before - 1).toEqual(after);
		await page2.close();
	});
});
