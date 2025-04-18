import * as constants from '../../config/constants';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createChannelAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - Direct Messages', () => {
	let poFederationChannelServer1: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let userFromServer1UsernameOnly: string;

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer1UsernameOnly = await registerUser(apiServer1);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
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
		await page.addInitScript(() => {
			window.localStorage.setItem('fuselage-localStorage-members-list-type', JSON.stringify('online'));
		});
	});

	test.describe('Direct Messages (DMs)', () => {
		test.describe('Inviting users using the creation modal', () => {
			test('expect to create a DM inviting an user from the Server B who does not exist in Server A yet', async ({
				browser,
				apiServer2,
				page,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
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

				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_SERVER_1.username,
					constants.RC_SERVER_1.matrixServerName,
				);

				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.btnUserInfo.click();
				await poFederationChannelServer1.content.sendMessage('hello world');

				await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.btnUserInfo.click();

				await expect(poFederationChannelServer1.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test('expect to create a DM inviting an user from the Server B who already exist in Server A', async ({ browser, page }) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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

				await poFederationChannelServer1.createDirectMessagesUsingModal([userFromServer2UsernameOnly]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.btnUserInfo.click();
				await poFederationChannelServer1.content.sendMessage('hello world');

				await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.btnUserInfo.click();

				await expect(poFederationChannelServer1.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test.describe('With multiple users (when the remote user does not exists in the server A yet)', () => {
				let createdUsernameFromServer2: string;

				test('expect to create a DM inviting an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', async ({
					browser,
					apiServer2,
					page,
				}) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);
					createdUsernameFromServer2 = await registerUser(apiServer2);

					await doLogin({
						page: pageForServer2,
						server: {
							url: constants.RC_SERVER_2.url,
							username: createdUsernameFromServer2,
							password: constants.RC_SERVER_2.password,
						},
						storeState: false,
					});

					await page.goto(`${constants.RC_SERVER_1.url}/home`);
					await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

					const fullUsernameFromServer2 = formatIntoFullMatrixUsername(createdUsernameFromServer2, constants.RC_SERVER_2.matrixServerName);
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);
					const adminUsernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
						constants.RC_SERVER_1.username,
						constants.RC_SERVER_1.matrixServerName,
					);
					const userCreatedWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer1UsernameOnly,
						constants.RC_SERVER_1.matrixServerName,
					);

					await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2, userFromServer1UsernameOnly]);

					await poFederationChannelServer1.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await poFederationChannelServer2.sidenav.openDMMultipleChat(userCreatedWithDomainFromServer1);
					await poFederationChannelServer2.tabs.btnTabMembers.click();
					await poFederationChannelServer2.tabs.members.showAllUsers();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

					await expect(poFederationChannelServer2.tabs.members.getUserInList(createdUsernameFromServer2)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(userCreatedWithDomainFromServer1)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(adminUsernameWithDomainFromServer1)).toBeVisible();
					await pageForServer2.close();
				});

				test('expect the user from Server A (locally) is able to access the previous created group', async ({ browser }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);

					await doLogin({
						page: page2,
						server: {
							url: constants.RC_SERVER_1.url,
							username: userFromServer1UsernameOnly,
							password: constants.RC_SERVER_1.password,
						},
						storeState: false,
					});

					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);

					await page2.goto(`${constants.RC_SERVER_1.url}/home`);

					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});

			test.describe('With multiple users (when the user from Server B already exists in Server A)', () => {
				test('expect to create a DM inviting an user from the Server B who already exist in Server A + an user from Server A only (locally)', async ({
					browser,
					page,
				}) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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
					const usernameOriginalFromServer1OnlyWithDomain = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer1UsernameOnly,
						constants.RC_SERVER_1.matrixServerName,
					);

					await poFederationChannelServer1.createDirectMessagesUsingModal([userFromServer2UsernameOnly, userFromServer1UsernameOnly]);

					await poFederationChannelServer1.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await poFederationChannelServer2.sidenav.openDMMultipleChat(usernameOriginalFromServer1OnlyWithDomain);
					await poFederationChannelServer2.tabs.btnTabMembers.click();
					await poFederationChannelServer2.tabs.members.showAllUsers();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

					await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameOriginalFromServer1OnlyWithDomain)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
					await pageForServer2.close();
				});

				test('expect the user from Server A (locally) is able to access the previous created', async ({ browser }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);

					await doLogin({
						page: page2,
						server: {
							url: constants.RC_SERVER_1.url,
							username: userFromServer1UsernameOnly,
							password: constants.RC_SERVER_1.password,
						},
						storeState: false,
					});
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer2UsernameOnly,
						constants.RC_SERVER_2.matrixServerName,
					);
					await page2.goto(`${constants.RC_SERVER_1.url}/home`);

					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});
		});

		test.describe('Using Slash commands', () => {
			test('expect to create a DM inviting an user from the Server B who does not exist in Server A yet', async ({
				browser,
				page,
				apiServer2,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
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

				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_SERVER_1.username,
					constants.RC_SERVER_1.matrixServerName,
				);

				await poFederationChannelServer1.sidenav.openChat('general');

				await poFederationChannelServer1.content.dispatchSlashCommand(`/federation dm ${fullUsernameFromServer2}`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.btnUserInfo.click();
				await poFederationChannelServer1.content.sendMessage('hello world');

				await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.btnUserInfo.click();

				await expect(poFederationChannelServer1.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test('expect to create a DM inviting an user from the Server B who already exist in Server A', async ({
				browser,
				page,
				apiServer2,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const createdUsernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: createdUsernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(createdUsernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				await poFederationChannelServer1.sidenav.logout();
				await createChannelAndInviteRemoteUserToCreateLocalUser({
					page,
					poFederationChannelServer: poFederationChannelServer1,
					fullUsernameFromServer: fullUsernameFromServer2,
					server: constants.RC_SERVER_1,
					closePageAfterCreation: false,
				});

				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					createdUsernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				const adminUsernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_SERVER_1.username,
					constants.RC_SERVER_1.matrixServerName,
				);

				await poFederationChannelServer1.sidenav.openChat('general');

				await poFederationChannelServer1.content.dispatchSlashCommand(`/federation dm @${usernameWithDomainFromServer2}`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.btnUserInfo.click();
				await poFederationChannelServer1.content.sendMessage('hello world');

				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.btnUserInfo.click();

				await expect(poFederationChannelServer1.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.dmUserMember.getUserInfoUsername(adminUsernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test('expect to create a DM inviting an user from the Server A who does not exist in Server B yet', async ({
				browser,
				page,
				apiServer1,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const createdUsernameFromServer1 = await registerUser(apiServer1);

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: constants.RC_SERVER_2.username,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});

				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer1 = formatIntoFullMatrixUsername(createdUsernameFromServer1, constants.RC_SERVER_1.matrixServerName);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
					createdUsernameFromServer1,
					constants.RC_SERVER_1.matrixServerName,
				);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_SERVER_2.username,
					constants.RC_SERVER_2.matrixServerName,
				);

				await poFederationChannelServer2.sidenav.openChat('general');

				await poFederationChannelServer2.content.dispatchSlashCommand(`/federation dm ${fullUsernameFromServer1}`);

				await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.btnUserInfo.click();
				await poFederationChannelServer2.content.sendMessage('hello world');

				await poFederationChannelServer1.sidenav.logout();
				await doLogin({
					page,
					server: {
						url: constants.RC_SERVER_1.url,
						username: createdUsernameFromServer1,
						password: constants.RC_SERVER_1.password,
					},
					storeState: false,
				});

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.btnUserInfo.click();

				await expect(poFederationChannelServer2.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer1)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer2)).toBeVisible();
				await pageForServer2.close();
			});

			test('expect to create a DM inviting an user from the Server A who already exist in Server B', async ({
				browser,
				page,
				apiServer2,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const createdUsernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: createdUsernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(createdUsernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				await poFederationChannelServer1.sidenav.logout();
				await createChannelAndInviteRemoteUserToCreateLocalUser({
					page,
					poFederationChannelServer: poFederationChannelServer1,
					fullUsernameFromServer: fullUsernameFromServer2,
					server: constants.RC_SERVER_1,
					closePageAfterCreation: false,
				});

				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					createdUsernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				const adminUsernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_SERVER_1.username,
					constants.RC_SERVER_1.matrixServerName,
				);
				await poFederationChannelServer2.sidenav.openChat('general');

				await poFederationChannelServer2.content.dispatchSlashCommand(`/federation dm @${adminUsernameWithDomainFromServer1}`);
				await page.waitForTimeout(2000);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.btnUserInfo.click();
				await poFederationChannelServer2.content.sendMessage('hello world');

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.btnUserInfo.click();

				await expect(poFederationChannelServer2.tabs.dmUserMember.getUserInfoUsername(adminUsernameWithDomainFromServer1)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.dmUserMember.getUserInfoUsername(usernameWithDomainFromServer2)).toBeVisible();
				await pageForServer2.close();
			});

			test.describe('With multiple users (when the remote user does not exists in the server A yet)', () => {
				let createdUsernameFromServer2: string;

				test('expect to create a DM, and invite an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', async ({
					browser,
					apiServer2,
					page,
				}) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);
					createdUsernameFromServer2 = await registerUser(apiServer2);

					await doLogin({
						page: pageForServer2,
						server: {
							url: constants.RC_SERVER_2.url,
							username: createdUsernameFromServer2,
							password: constants.RC_SERVER_2.password,
						},
						storeState: false,
					});

					await page.goto(`${constants.RC_SERVER_1.url}/home`);
					await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

					const fullUsernameFromServer2 = formatIntoFullMatrixUsername(createdUsernameFromServer2, constants.RC_SERVER_2.matrixServerName);
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);
					const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
						constants.RC_SERVER_1.username,
						constants.RC_SERVER_1.matrixServerName,
					);
					const usernameOriginalFromServer1OnlyWithDomain = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer1UsernameOnly,
						constants.RC_SERVER_1.matrixServerName,
					);

					await poFederationChannelServer1.sidenav.openChat('general');
					await poFederationChannelServer1.content.dispatchSlashCommand(
						`/federation dm ${fullUsernameFromServer2} @${userFromServer1UsernameOnly}`,
					);

					await poFederationChannelServer1.sidenav.openDMMultipleChat(userFromServer1UsernameOnly);
					await poFederationChannelServer1.content.sendMessage('hello world');
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await poFederationChannelServer2.sidenav.openDMMultipleChat(usernameOriginalFromServer1OnlyWithDomain);
					await poFederationChannelServer2.tabs.btnTabMembers.click();
					await poFederationChannelServer2.tabs.members.showAllUsers();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

					await expect(poFederationChannelServer2.tabs.members.getUserInList(createdUsernameFromServer2)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameOriginalFromServer1OnlyWithDomain)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
					await pageForServer2.close();
				});

				test('expect the user from Server A (locally) is able to access the previous created group', async ({ browser }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);

					await doLogin({
						page: page2,
						server: {
							url: constants.RC_SERVER_1.url,
							username: userFromServer1UsernameOnly,
							password: constants.RC_SERVER_1.password,
						},
						storeState: false,
					});

					await page2.goto(`${constants.RC_SERVER_1.url}/home`);
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);

					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});

			test.describe('With multiple users (when the user from Server B already exists in Server A)', () => {
				test('expect to create a DM, and invite an user from the Server B who already exist in Server A + an user from Server A only (locally)', async ({
					browser,
					page,
				}) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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
					const usernameOriginalFromServer1OnlyWithDomain = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer1UsernameOnly,
						constants.RC_SERVER_1.matrixServerName,
					);

					await poFederationChannelServer1.sidenav.openChat('general');

					await poFederationChannelServer1.content.dispatchSlashCommand(
						`/federation dm @${usernameWithDomainFromServer2} @${userFromServer1UsernameOnly}`,
					);

					await poFederationChannelServer1.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await poFederationChannelServer2.sidenav.openDMMultipleChat(usernameOriginalFromServer1OnlyWithDomain);
					await poFederationChannelServer2.tabs.btnTabMembers.click();
					await poFederationChannelServer2.tabs.members.showAllUsers();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

					await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameOriginalFromServer1OnlyWithDomain)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
					await pageForServer2.close();
				});

				test('expect the user from Server A (locally) is able to access the previous created group', async ({ browser }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);

					await doLogin({
						page: page2,
						server: {
							url: constants.RC_SERVER_1.url,
							username: userFromServer1UsernameOnly,
							password: constants.RC_SERVER_1.password,
						},
						storeState: false,
					});

					await page2.goto(`${constants.RC_SERVER_1.url}/home`);
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer2UsernameOnly,
						constants.RC_SERVER_2.matrixServerName,
					);

					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});
		});

		test.describe('DMs', () => {
			let createdUsernameFromServer2: string;
			let usernameWithDomainFromServer2: string;
			let fullUsernameFromServer2: string;
			const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
				constants.RC_SERVER_1.username,
				constants.RC_SERVER_1.matrixServerName,
			);

			test.beforeAll(async ({ browser, apiServer2 }) => {
				createdUsernameFromServer2 = await registerUser(apiServer2);
				const page = await browser.newPage();
				const poDmFederationServer1 = new FederationChannel(page);
				await doLogin({
					page,
					server: {
						url: constants.RC_SERVER_1.url,
						username: constants.RC_SERVER_1.username,
						password: constants.RC_SERVER_1.password,
					},
				});

				fullUsernameFromServer2 = formatIntoFullMatrixUsername(createdUsernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					userFromServer2UsernameOnly,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poDmFederationServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);
				await page.close();
			});

			test.describe('Visual Elements', () => {
				test('expect the calls button to be disabled', async ({ browser, page }) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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

					await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');

					await expect(poFederationChannelServer1.tabs.btnCall).toBeDisabled();
					await expect(poFederationChannelServer1.tabs.btnVideoCall).toBeDisabled();

					await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
					await expect(poFederationChannelServer2.tabs.btnCall).toBeDisabled();
					await expect(poFederationChannelServer1.tabs.btnVideoCall).toBeDisabled();

					await pageForServer2.close();
				});

				test('expect the discussion button to be disabled', async ({ browser, page }) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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

					await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');

					await expect(poFederationChannelServer1.tabs.btnDiscussion).toBeDisabled();

					await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
					await expect(poFederationChannelServer2.tabs.btnDiscussion).toBeDisabled();

					await pageForServer2.close();
				});
			});

			test.describe('Owner rights', () => {
				test('expect neither the owner nor the invitee to be able to edit the channel info (the channel info button should not be visible)', async ({
					browser,
					page,
				}) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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

					await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');

					await expect(poFederationChannelServer1.tabs.btnRoomInfo).not.toBeVisible();

					await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
					await expect(poFederationChannelServer2.tabs.btnRoomInfo).not.toBeVisible();

					await pageForServer2.close();
				});

				test('expect the owner nor the invitee to be able to add users to DMs (the button to add users should not be visible)', async ({
					browser,
					page,
				}) => {
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

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

					await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world');

					await expect(poFederationChannelServer1.tabs.btnTabMembers).not.toBeVisible();

					await poFederationChannelServer2.sidenav.openChat(usernameWithDomainFromServer1);
					await expect(poFederationChannelServer2.tabs.btnTabMembers).not.toBeVisible();

					await pageForServer2.close();
				});
			});
		});
	});
});
