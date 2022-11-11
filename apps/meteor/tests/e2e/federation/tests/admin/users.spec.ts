import faker from '@faker-js/faker';

import { test, expect } from '../../utils/test';
import { FederationChannel } from '../../page-objects/channel';
import * as constants from '../../config/constants';
import { registerUser } from '../../utils/register-user';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { doLogin } from '../../utils/auth';
import { createChannelAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';

test.describe.skip('Federation - Admin Panel - Users', () => {
	let poFederationChannelServer1: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let userFromServer1UsernameOnly: string;
	let createdChannelName: string;

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		userFromServer1UsernameOnly = await registerUser(apiServer1);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
		const page = await browser.newPage();
		poFederationChannelServer1 = new FederationChannel(page);
		createdChannelName = await createChannelAndInviteRemoteUserToCreateLocalUser({
			page,
			poFederationChannelServer1,
			userFromServer2UsernameOnly,
		});
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

		await page.addInitScript(() => {
			window.localStorage.setItem('fuselage-localStorage-members-list-type', JSON.stringify('online'));
		});
	});

	test.afterEach(async ({ page }) => {
		await poFederationChannelServer1.sidenav.logout();
		await page.close();
	});

	test('expect to not be able to delete federated users from the admin panel', async ({}) => {});

	test('expect to not be able to reset E2E keys from federated users from the admin panel', async ({}) => {});

	test('expect to not be able to reset TOTP from federated users from the admin panel', async ({}) => {});

	test('expect to not be able to make federated users  as admins from the admin panel', async ({}) => {});

	test('expect to not be able to deactivate federated users from the admin panel', async ({}) => {});

	test('expect to not be able to edit federated users from the admin panel', async ({ browser, page }) => {
		const pageForServer2 = await browser.newPage();
		const poFederationChannelServer2 = new FederationChannel(pageForServer2);
		const channelName = faker.datatype.uuid();

		await doLogin({
			page: pageForServer2,
			server: {
				url: constants.RC_SERVER_2.url,
				username: userFromServer2UsernameOnly,
				password: constants.RC_SERVER_2.password,
			},
			storeState: false,
		});

		await page.goto(`${constants.RC_SERVER_1.url}/home`);
		await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

		const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
			userFromServer2UsernameOnly,
			constants.RC_SERVER_2.matrixServerName,
		);
		const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
			constants.RC_SERVER_1.username,
			constants.RC_SERVER_1.matrixServerName,
		);

		await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [userFromServer2UsernameOnly]);

		await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/channel/${channelName}`);

		await poFederationChannelServer1.sidenav.openChat(channelName);
		await poFederationChannelServer1.tabs.btnTabMembers.click();
		await poFederationChannelServer1.tabs.members.showAllUsers();

		await poFederationChannelServer2.sidenav.openChat(channelName);
		await poFederationChannelServer2.tabs.btnTabMembers.click();
		await poFederationChannelServer2.tabs.members.showAllUsers();

		await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
		await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

		await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
		await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
		await pageForServer2.close();
	});

	test('expect to federated users not being counted as a seat cap in an EE environment', async ({ browser, page }) => {
		const pageForServer2 = await browser.newPage();
		const poFederationChannelServer2 = new FederationChannel(pageForServer2);
		const channelName = faker.datatype.uuid();

		await doLogin({
			page: pageForServer2,
			server: {
				url: constants.RC_SERVER_2.url,
				username: userFromServer2UsernameOnly,
				password: constants.RC_SERVER_2.password,
			},
			storeState: false,
		});

		await page.goto(`${constants.RC_SERVER_1.url}/home`);
		await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

		const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
			userFromServer2UsernameOnly,
			constants.RC_SERVER_2.matrixServerName,
		);
		const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
			constants.RC_SERVER_1.username,
			constants.RC_SERVER_1.matrixServerName,
		);

		await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [userFromServer2UsernameOnly]);

		await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/channel/${channelName}`);

		await poFederationChannelServer1.sidenav.openChat(channelName);
		await poFederationChannelServer1.tabs.btnTabMembers.click();
		await poFederationChannelServer1.tabs.members.showAllUsers();

		await poFederationChannelServer2.sidenav.openChat(channelName);
		await poFederationChannelServer2.tabs.btnTabMembers.click();
		await poFederationChannelServer2.tabs.members.showAllUsers();

		await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
		await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

		await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
		await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
		await pageForServer2.close();
	});
});
