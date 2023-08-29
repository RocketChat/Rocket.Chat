import { faker } from '@faker-js/faker';

import * as constants from '../../config/constants';
import { FederationAdmin } from '../../page-objects/admin';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createChannelUsingAPI } from '../../utils/channel';
import { formatIntoFullMatrixUsername } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - Admin Panel - Rooms', () => {
	let poFederationChannelServer1: FederationChannel;
	let userFromServer2UsernameOnly: string;
	const channelName = faker.string.uuid();
	let poFederationAdmin: FederationAdmin;

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer2UsernameOnly = await registerUser(apiServer2);

		const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
		const page = await browser.newPage();
		poFederationChannelServer1 = new FederationChannel(page);
		await doLogin({
			page,
			server: constants.RC_SERVER_1,
		});

		await page.goto(`${constants.RC_SERVER_1.url}/home`);
		await createChannelUsingAPI(apiServer2, channelName);
		await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);
		await page.close();
	});

	test.afterAll(async ({ apiServer1, apiServer2 }) => {
		await tearDownTesting(apiServer1);
		await tearDownTesting(apiServer2);
	});

	test.beforeEach(async ({ page }) => {
		poFederationAdmin = new FederationAdmin(page);
		await doLogin({
			page,
			server: {
				url: constants.RC_SERVER_2.url,
				username: constants.RC_SERVER_2.username,
				password: constants.RC_SERVER_2.password,
			},
		});
		await page.goto(`${constants.RC_SERVER_2.url}/admin/rooms`);
	});

	test('expect to have the 2 rooms(with the same name) created and showing correctly', async ({ page }) => {
		await poFederationAdmin.inputSearchRooms.type(channelName);
		await page.waitForTimeout(5000);
		await expect(await page.locator(`table tbody tr`).count()).toBe(2);
	});

	test('expect to be able to edit only (name, topic and favorite) when the room is a federated one', async ({ page }) => {
		await poFederationAdmin.inputSearchRooms.type(channelName);
		await page.waitForTimeout(5000);
		await page.locator(`table tbody tr`).first().click();

		await expect(poFederationAdmin.roomsInputName).not.toBeDisabled();
		await expect(poFederationAdmin.roomsInputTopic).not.toBeDisabled();
		await expect(poFederationAdmin.roomsInputFavorite).not.toBeDisabled();

		await expect(poFederationAdmin.roomsInputDescription).not.toBeVisible();
		await expect(poFederationAdmin.roomsInputAnnouncement).not.toBeVisible();
		await expect(poFederationAdmin.roomsInputPrivate).not.toBeVisible();
		await expect(poFederationAdmin.roomsInputReadOnly).not.toBeVisible();
		await expect(poFederationAdmin.roomsInputArchived).not.toBeVisible();
		await expect(poFederationAdmin.roomsInputDefault).toBeDisabled();
		await expect(poFederationAdmin.roomsInputFeatured).toBeDisabled();
		await expect(poFederationAdmin.roomsBtnDelete).toBeDisabled();
		await expect(poFederationAdmin.roomsBtnUploadAvatar).toBeDisabled();
		await expect(poFederationAdmin.roomsBtnDefaultAvatar).toBeDisabled();
	});
});
