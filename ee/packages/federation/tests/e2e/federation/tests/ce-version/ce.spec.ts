import { faker } from '@faker-js/faker';

import * as constants from '../../config/constants';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createGroupAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';
import { formatIntoFullMatrixUsername } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - CE version', () => {
	let poFederationChannelServer2: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let userFromServer1UsernameOnly: string;
	let fullUsernameFromServer1: string;
	let fullUsernameFromServer2: string;

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer1UsernameOnly = await registerUser(apiServer1);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
		fullUsernameFromServer1 = formatIntoFullMatrixUsername(userFromServer1UsernameOnly, constants.RC_SERVER_1.matrixServerName);
		fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
		const page = await browser.newPage();
		poFederationChannelServer2 = new FederationChannel(page);
	});

	test.afterAll(async ({ apiServer1, apiServer2 }) => {
		await tearDownTesting(apiServer1);
		await tearDownTesting(apiServer2);
	});

	test.beforeEach(async ({ page }) => {
		poFederationChannelServer2 = new FederationChannel(page);
		await doLogin({
			page,
			server: {
				url: constants.RC_SERVER_2.url,
				username: constants.RC_SERVER_2.username,
				password: constants.RC_SERVER_2.password,
			},
		});
		await page.goto(`${constants.RC_SERVER_2.url}/home`);
	});

	test('expect to not be able to create channels from the UI', async () => {
		await poFederationChannelServer2.sidenav.openNewByLabel('Channel');
		await expect(poFederationChannelServer2.sidenav.checkboxFederatedChannel).toBeDisabled();
	});

	test('expect to not be able to create DMs from UI inviting external users (an user who does not exists on the server yet)', async () => {
		await poFederationChannelServer2.createDirectMessagesUsingModal([fullUsernameFromServer1]);
		await expect(poFederationChannelServer2.toastError).toBeVisible();
	});

	test('expect to not be able to create DMs from UI inviting external users (an user who already exists in the server)', async ({
		browser,
	}) => {
		const page2 = await browser.newPage();
		const poFederationChannelServer1 = new FederationChannel(page2);
		await createGroupAndInviteRemoteUserToCreateLocalUser({
			page: page2,
			poFederationChannelServer: poFederationChannelServer1,
			fullUsernameFromServer: fullUsernameFromServer2,
			server: constants.RC_SERVER_1,
		});
		await poFederationChannelServer2.createDirectMessagesUsingModal([fullUsernameFromServer1]);
		await expect(poFederationChannelServer2.toastError).toBeVisible();
	});

	test('expect to not be able to invite federated users to non-federated rooms (using modal)', async () => {
		const channelName = faker.string.uuid();
		await poFederationChannelServer2.createNonFederatedPublicChannelAndInviteUsersUsingCreationModal(channelName, [
			fullUsernameFromServer2,
		]);

		await poFederationChannelServer2.sidenav.openChat(channelName);
		await poFederationChannelServer2.tabs.btnTabMembers.click();
		await poFederationChannelServer2.tabs.members.showAllUsers();

		await expect(poFederationChannelServer2.tabs.members.getUserInList(constants.RC_SERVER_2.username)).toBeVisible();
	});
});
