import faker from '@faker-js/faker';
import { test, expect } from '../../utils/test';
import { FederationChannel } from '../../page-objects/channel';
import * as constants from '../../config/constants';
import { registerUser } from '../../utils/register-user';
import { Page } from '@playwright/test';
import { doLogin } from '../../config/global-setup';

test.use({ storageState: 'admin-server-ee-session.json' });

test.describe.parallel('Federation - Channel Creation', () => {
	let poFederationChannelServer1: FederationChannel;
	let poFederationChannelServer2: FederationChannel;
	let pageForServer2: Page;

	test.beforeEach(async ({ page, browser }) => {
		poFederationChannelServer1 = new FederationChannel(page);

		pageForServer2 = await browser.newPage();

		poFederationChannelServer2 = new FederationChannel(pageForServer2);
	});

	test.describe('Channel (Public)', () => {

		test.describe('Inviting users using the creation modal', () => {

			test.only('expect to create a channel inviting an user from the Server B who does not exist in Server A yet', async ({ page, apiServer2 }) => {
				const channelName = faker.datatype.uuid();
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});

				await page.goto(`${ constants.RC_SERVER_1.url }/home`);
				await pageForServer2.goto(`${ constants.RC_SERVER_2.url }/home`);

				const fullUsernameFromServer2 = `@${usernameFromServer2}:${ constants.RC_SERVER_2.matrixServerName }`;
				const usernameWithDomainFromServer2 = `${usernameFromServer2}:${ constants.RC_SERVER_2.matrixServerName }`;
				const usernameWithDomainFromServer1 = `${constants.RC_SERVER_1.username}:${constants.RC_SERVER_1.matrixServerName}`;

				await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/channel/${channelName}`);

				await poFederationChannelServer1.sidenav.openChat(channelName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(channelName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();

			});

			test('Create a channel inviting an user from the Server B who already exist in Server A', () => {

			});

			test('Create a channel inviting an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => {

			});

			test('Create a channel inviting an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => {

			});

			test('Create a channel inviting an user from Server A only (locally)', () => {

			});
		})

		test.describe('Inviting users using the Add Members button', () => {

			test('Create an empty channel, and invite an user from the Server B who does not exist in Server A yet', () => {

			});

			test('Create an empty channel, and invite an user from the Server B who already exist in Server A', () => {

			});

			test('Create an empty channel, and invite an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => {

			});

			test('Create an empty channel, and invite an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => {

			});

			test('Create an empty channel, and invite an an user from Server A only (locally)', () => {

			});
		})


	});

});
