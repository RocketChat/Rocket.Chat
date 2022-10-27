import faker from '@faker-js/faker';

import { test, expect } from '../../utils/test';
import { FederationChannel } from '../../page-objects/channel';
import * as constants from '../../config/constants';
import { registerUser } from '../../utils/register-user';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { doLogin } from '../../utils/auth';

test.use({ storageState: 'admin-server-ee-session.json' });

test.describe.parallel('Federation - Channel Creation', () => {
	let poFederationChannelServer1: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let userFromServer1UsernameOnly: string;

	test.beforeAll(async ({ apiServer1, apiServer2 }) => {
		userFromServer1UsernameOnly = await registerUser(apiServer1);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
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

	test.afterEach(async () => {
		await poFederationChannelServer1.sidenav.logout();
	});

	test.describe('Channel (Public)', () => {
		test.describe('Inviting users using the creation modal', () => {
			test('expect to create a channel inviting an user from the Server B who does not exist in Server A yet', async ({
				browser,
				page,
			}) => {
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

				await page.goto(`${ constants.RC_SERVER_1.url }/home`);
				await pageForServer2.goto(`${ constants.RC_SERVER_2.url }/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(constants.RC_SERVER_1.username, constants.RC_SERVER_1.matrixServerName);

				await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${ constants.RC_SERVER_1.url }/channel/${ channelName }`);

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

			test('expect to create a channel inviting an user from the Server B who already exist in Server A', async ({
				browser,
				page,
			}) => {
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

				await page.goto(`${ constants.RC_SERVER_1.url }/home`);
				await pageForServer2.goto(`${ constants.RC_SERVER_2.url }/home`);

				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(constants.RC_SERVER_1.username, constants.RC_SERVER_1.matrixServerName);

				await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [userFromServer2UsernameOnly]);

				await expect(page).toHaveURL(`${ constants.RC_SERVER_1.url }/channel/${ channelName }`);

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

			test('expect to create a channel inviting an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', async ({
				browser,
				apiServer2,
				page,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
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

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(constants.RC_SERVER_1.username, constants.RC_SERVER_1.matrixServerName);
				const userCreatedWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(userFromServer1UsernameOnly, constants.RC_SERVER_1.matrixServerName);

				await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2, userFromServer1UsernameOnly]);

				await expect(page).toHaveURL(`${ constants.RC_SERVER_1.url }/channel/${ channelName }`);

				await poFederationChannelServer1.sidenav.openChat(channelName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(channelName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(userCreatedWithDomainFromServer1)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();

				await poFederationChannelServer1.sidenav.logout();

				await doLogin({
					page,
					server: {
						url: constants.RC_SERVER_1.url,
						username: userFromServer1UsernameOnly,
						password: constants.RC_SERVER_1.password,
					},
					storeState: false,
				});

				await page.goto(`${ constants.RC_SERVER_1.url }/home`);

				await poFederationChannelServer1.sidenav.openChat(channelName);

				await expect(page).toHaveURL(`${ constants.RC_SERVER_1.url }/channel/${ channelName }`);

				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
			});

			test('expect to create a channel inviting an user from the Server B who already exist in Server A + an user from Server A only (locally)', async ({
				browser,
				page,
			}) => {
				await page.context().storageState({ path: 'admin-server-ee-session.json' });
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

				await page.goto(`${ constants.RC_SERVER_1.url }/home`);
				await pageForServer2.goto(`${ constants.RC_SERVER_2.url }/home`);

				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(constants.RC_SERVER_1.username, constants.RC_SERVER_1.matrixServerName);
				const usernameOriginalFromServer1OnlyWithDomain = formatUsernameAndDomainIntoMatrixFormat(userFromServer1UsernameOnly, constants.RC_SERVER_1.matrixServerName);

				await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [userFromServer1UsernameOnly, userFromServer2UsernameOnly]);

				await expect(page).toHaveURL(`${ constants.RC_SERVER_1.url }/channel/${ channelName }`);

				await poFederationChannelServer1.sidenav.openChat(channelName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(channelName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameOriginalFromServer1OnlyWithDomain)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();

				await poFederationChannelServer1.sidenav.logout();

				await doLogin({
					page,
					server: {
						url: constants.RC_SERVER_1.url,
						username: userFromServer1UsernameOnly,
						password: constants.RC_SERVER_1.password,
					},
					storeState: false,
				});

				await page.goto(`${ constants.RC_SERVER_1.url }/home`);

				await poFederationChannelServer1.sidenav.openChat(channelName);

				await expect(page).toHaveURL(`${ constants.RC_SERVER_1.url }/channel/${ channelName }`);

				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
			});

			test('Create a channel inviting an user from Server A only (locally)', () => { });
		});

		test.describe('Inviting users using the Add Members button', () => {
			test('Create an empty channel, and invite an user from the Server B who does not exist in Server A yet', () => { });

			test('Create an empty channel, and invite an user from the Server B who already exist in Server A', () => { });

			test('Create an empty channel, and invite an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => { });

			test('Create an empty channel, and invite an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => { });

			test('Create an empty channel, and invite an an user from Server A only (locally)', () => { });
		});
	});
});
