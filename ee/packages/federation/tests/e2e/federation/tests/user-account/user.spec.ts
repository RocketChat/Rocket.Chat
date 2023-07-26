import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import * as constants from '../../config/constants';
import { FederationAccountProfile } from '../../page-objects/account-profile';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createChannelAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - User Account Pannel', () => {
	let poFederationChannelServer1: FederationChannel;
	let poFederationChannelServer2: FederationChannel;
	let poFederationAccountProfileServer1: FederationAccountProfile;
	let userFromServer2UsernameOnly: string;
	let createdChannelName: string;
	let pageForServer2: Page;
	let usernameWithDomainFromServer2: string;
	const adminUsernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
		constants.RC_SERVER_1.username,
		constants.RC_SERVER_1.matrixServerName,
	);

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
		const page = await browser.newPage();
		poFederationChannelServer1 = new FederationChannel(page);
		usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
			userFromServer2UsernameOnly,
			constants.RC_SERVER_2.matrixServerName,
		);
		const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
		createdChannelName = await createChannelAndInviteRemoteUserToCreateLocalUser({
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

	test.beforeEach(async ({ browser, page }) => {
		pageForServer2 = await browser.newPage();

		poFederationAccountProfileServer1 = new FederationAccountProfile(page);
		poFederationChannelServer1 = new FederationChannel(page);
		await doLogin({
			page,
			server: {
				url: constants.RC_SERVER_1.url,
				username: constants.RC_SERVER_1.username,
				password: constants.RC_SERVER_1.password,
			},
		});

		poFederationChannelServer2 = new FederationChannel(pageForServer2);
		await doLogin({
			page: pageForServer2,
			server: {
				url: constants.RC_SERVER_2.url,
				username: userFromServer2UsernameOnly,
				password: constants.RC_SERVER_2.password,
			},
			storeState: false,
		});

		await page.addInitScript(() => {
			window.localStorage.setItem('fuselage-localStorage-members-list-type', JSON.stringify('online'));
		});
	});

	test.afterEach(async ({ page }) => {
		await poFederationChannelServer1.sidenav.logout();
		await page.close();
	});

	test('expect to be able to edit a name in Server A and it must be reflected on Server B', async ({ page }) => {
		await page.goto(`${constants.RC_SERVER_1.url}/home`);
		await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

		const newName = faker.person.fullName();

		await page.goto(`${constants.RC_SERVER_1.url}/account/profile`);
		await poFederationAccountProfileServer1.inputName.fill(newName);
		await poFederationAccountProfileServer1.btnSubmit.click();

		await page.goto(`${constants.RC_SERVER_1.url}/home`);

		await poFederationChannelServer1.sidenav.openChat(createdChannelName);
		await poFederationChannelServer2.sidenav.openChat(createdChannelName);

		await poFederationChannelServer2.tabs.btnTabMembers.click();
		await poFederationChannelServer2.tabs.members.showAllUsers();

		await expect(poFederationChannelServer2.tabs.members.getUserInList(adminUsernameWithDomainFromServer1)).toContainText(newName);
		await pageForServer2.close();
	});

	test('expect to be able to edit a name in Server B and it must be reflected on Server A', async ({ page }) => {
		await page.goto(`${constants.RC_SERVER_1.url}/home`);
		await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

		const poFederationAccountProfileServer2 = new FederationAccountProfile(pageForServer2);

		const newName = faker.person.fullName();

		await pageForServer2.goto(`${constants.RC_SERVER_2.url}/account/profile`);
		await poFederationAccountProfileServer2.inputName.fill(newName);
		await poFederationAccountProfileServer2.btnSubmit.click();

		await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

		await poFederationChannelServer1.sidenav.openChat(createdChannelName);
		await poFederationChannelServer2.sidenav.openChat(createdChannelName);

		await poFederationChannelServer1.tabs.btnTabMembers.click();
		await poFederationChannelServer1.tabs.members.showAllUsers();

		await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toContainText(newName);
		await pageForServer2.close();
	});
});
