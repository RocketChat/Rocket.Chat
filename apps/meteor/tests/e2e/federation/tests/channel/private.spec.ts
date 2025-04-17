import { faker } from '@faker-js/faker';

import * as constants from '../../config/constants';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createGroupAndInviteRemoteUserToCreateLocalUser, createGroupUsingAPI } from '../../utils/channel';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - Group Creation', () => {
	let poFederationChannelServer1: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let userFromServer1UsernameOnly: string;
	let createdGroupName: string;

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer1UsernameOnly = await registerUser(apiServer1);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
		const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
		const page = await browser.newPage();
		poFederationChannelServer1 = new FederationChannel(page);
		createdGroupName = await createGroupAndInviteRemoteUserToCreateLocalUser({
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

	test.afterEach(async ({ page }) => {
		await poFederationChannelServer1.sidenav.logout();
		await page.close();
	});

	test.describe('Group (Private)', () => {
		test.describe('Inviting users using the creation modal', () => {
			test('expect to create a group inviting an user from the Server B who does not exist in Server A yet', async ({
				browser,
				apiServer2,
				page,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const groupName = faker.string.uuid();
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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test('expect to create a group inviting an user from the Server B who already exist in Server A', async ({ browser, page }) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const groupName = faker.string.uuid();

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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [userFromServer2UsernameOnly]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test.describe('With multiple users (when the remote user does not exists in the server A yet)', () => {
				const createdGroup = faker.string.uuid();
				let createdUsernameFromServer2: string;

				test('expect to create a group inviting an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', async ({
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

					await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(createdGroup, [
						fullUsernameFromServer2,
						userFromServer1UsernameOnly,
					]);

					await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroup}`);

					await poFederationChannelServer1.sidenav.openChat(createdGroup);
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await poFederationChannelServer2.sidenav.openChat(createdGroup);
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

					await page2.goto(`${constants.RC_SERVER_1.url}/home`);

					await poFederationChannel1ForUser2.sidenav.openChat(createdGroup);

					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});

			test.describe('With multiple users (when the user from Server B already exists in Server A)', () => {
				const createdGroup = faker.string.uuid();
				test('expect to create a group inviting an user from the Server B who already exist in Server A + an user from Server A only (locally)', async ({
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

					await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(createdGroup, [
						userFromServer2UsernameOnly,
						userFromServer1UsernameOnly,
					]);

					await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroup}`);

					await poFederationChannelServer1.sidenav.openChat(createdGroup);
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await poFederationChannelServer2.sidenav.openChat(createdGroup);
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

					await poFederationChannel1ForUser2.sidenav.openChat(createdGroup);

					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer2UsernameOnly,
						constants.RC_SERVER_2.matrixServerName,
					);

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});

			test.describe('With local users only', () => {
				const createdGroup = faker.string.uuid();

				test('Create a group inviting an user from Server A only (locally)', async ({ page }) => {
					await page.goto(`${constants.RC_SERVER_1.url}/home`);

					await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(createdGroup, [userFromServer1UsernameOnly]);

					await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroup}`);

					await poFederationChannelServer1.sidenav.openChat(createdGroup);
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
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

					await poFederationChannel1ForUser2.sidenav.openChat(createdGroup);

					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});
		});

		test.describe('Inviting users using the Add Members button', () => {
			test('expect to create an empty group, and invite an user from the Server B who does not exist in Server A yet', async ({
				browser,
				page,
				apiServer2,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const groupName = faker.string.uuid();
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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, []);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();
				await poFederationChannelServer1.tabs.members.addMultipleUsers([fullUsernameFromServer2]);
				await expect(poFederationChannelServer1.toastSuccess).toBeVisible();

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test('expect to create an empty group, and invite an user from the Server B who already exist in Server A', async ({
				browser,
				page,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const groupName = faker.string.uuid();

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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, []);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();
				await poFederationChannelServer1.tabs.members.addMultipleUsers([userFromServer2UsernameOnly]);
				await expect(poFederationChannelServer1.toastSuccess).toBeVisible();

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(userFromServer2UsernameOnly)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await pageForServer2.close();
			});

			test.describe('With multiple users (when the remote user does not exists in the server A yet)', () => {
				const createdGroup = faker.string.uuid();
				let createdUsernameFromServer2: string;

				test('expect to create an empty group, and invite an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', async ({
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
					const userCreatedWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer1UsernameOnly,
						constants.RC_SERVER_1.matrixServerName,
					);

					await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(createdGroup, []);

					await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroup}`);

					await poFederationChannelServer1.sidenav.openChat(createdGroup);
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();
					await poFederationChannelServer1.tabs.members.addMultipleUsers([fullUsernameFromServer2, userFromServer1UsernameOnly]);
					await expect(poFederationChannelServer1.toastSuccess).toBeVisible();

					await poFederationChannelServer2.sidenav.openChat(createdGroup);
					await poFederationChannelServer2.tabs.btnTabMembers.click();
					await poFederationChannelServer2.tabs.members.showAllUsers();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

					await expect(poFederationChannelServer2.tabs.members.getUserInList(createdUsernameFromServer2)).toBeVisible();
					await expect(poFederationChannelServer2.tabs.members.getUserInList(userCreatedWithDomainFromServer1)).toBeVisible();
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

					await poFederationChannel1ForUser2.sidenav.openChat(createdGroup);

					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});

			test.describe('With multiple users (when the user from Server B already exists in Server A)', () => {
				const createdGroup = faker.string.uuid();

				test('expect to create an empty group, and invite an user from the Server B who already exist in Server A + an user from Server A only (locally)', async ({
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

					await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(createdGroup, []);

					await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroup}`);

					await poFederationChannelServer1.sidenav.openChat(createdGroup);
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();
					await poFederationChannelServer1.tabs.members.addMultipleUsers([userFromServer1UsernameOnly, userFromServer2UsernameOnly]);
					await expect(poFederationChannelServer1.toastSuccess).toBeVisible();

					await poFederationChannelServer2.sidenav.openChat(createdGroup);
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

					await poFederationChannel1ForUser2.sidenav.openChat(createdGroup);

					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();
					const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						userFromServer2UsernameOnly,
						constants.RC_SERVER_2.matrixServerName,
					);

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});

			test.describe('With local users only', () => {
				const createdGroup = faker.string.uuid();

				test('Create an empty group, and invite an an user from Server A only (locally)', async ({ page }) => {
					await page.goto(`${constants.RC_SERVER_1.url}/home`);

					await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(createdGroup, []);

					await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroup}`);

					await poFederationChannelServer1.sidenav.openChat(createdGroup);
					await poFederationChannelServer1.tabs.btnTabMembers.click();
					await poFederationChannelServer1.tabs.members.showAllUsers();
					await poFederationChannelServer1.tabs.members.addMultipleUsers([userFromServer1UsernameOnly]);

					await expect(poFederationChannelServer1.toastSuccess).toBeVisible();

					await expect(poFederationChannelServer1.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
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

					await poFederationChannel1ForUser2.sidenav.openChat(createdGroup);

					await poFederationChannel1ForUser2.tabs.btnTabMembers.click();
					await poFederationChannel1ForUser2.tabs.members.showAllUsers();

					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(userFromServer1UsernameOnly)).toBeVisible();
					await expect(poFederationChannel1ForUser2.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();
					await page2.close();
				});
			});
		});

		test.describe('Creating rooms with the same name in different servers, and invite users for those rooms', () => {
			const groupName = faker.string.uuid();
			let usernameFromServer2: string;

			test('expect to create a group and invite users from a server which already have a group with the exact same name', async ({
				browser,
				apiServer2,
				page,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				usernameFromServer2 = await registerUser(apiServer2);
				await createGroupUsingAPI(apiServer2, groupName);

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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();
				await expect(await poFederationChannelServer2.getFederationServerName()).toBe(constants.RC_SERVER_1.matrixServerName);
				await pageForServer2.close();
			});
			// TODO: skipping this test until we have an extra server ready to test this.
			test.skip('expect to create a group in the extra server inviting the same user from the same server as the previous one', async ({
				browser,
				apiServer2,
				page,
			}) => {
				const pageForServer2 = await browser.newPage();
				const pageForServerExtra = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const poFederationChannelServerExtra = new FederationChannel(pageForServerExtra);
				await createGroupUsingAPI(apiServer2, groupName);

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await doLogin({
					page: pageForServerExtra,
					server: {
						url: constants.RC_EXTRA_SERVER.url,
						username: constants.RC_EXTRA_SERVER.username,
						password: constants.RC_EXTRA_SERVER.password,
					},
					storeState: false,
				});

				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);
				await pageForServerExtra.goto(`${constants.RC_EXTRA_SERVER.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				const usernameWithDomainFromServerExtra = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_EXTRA_SERVER.username,
					constants.RC_EXTRA_SERVER.matrixServerName,
				);

				await poFederationChannelServerExtra.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_EXTRA_SERVER.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServerExtra)).toBeVisible();
				await pageForServer2.close();
			});
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

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroupName}`);

				await expect(poFederationChannelServer1.tabs.btnCall).toBeDisabled();
				await expect(poFederationChannelServer2.tabs.btnCall).toBeDisabled();
				await expect(poFederationChannelServer1.tabs.btnVideoCall).toBeDisabled();
				await expect(poFederationChannelServer2.tabs.btnVideoCall).toBeDisabled();

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

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroupName}`);

				await expect(poFederationChannelServer1.tabs.btnDiscussion).toBeDisabled();
				await expect(poFederationChannelServer2.tabs.btnDiscussion).toBeDisabled();

				await pageForServer2.close();
			});
		});

		test.describe('Owner rights', () => {
			test('expect only the owner of the room being able to add users through the UI', async ({ browser, page }) => {
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

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroupName}`);

				await expect(poFederationChannelServer1.tabs.btnTabMembers).toBeVisible();
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await expect(poFederationChannelServer1.tabs.members.addUsersButton).toBeVisible();

				await expect(poFederationChannelServer2.tabs.btnTabMembers).toBeVisible();
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await expect(poFederationChannelServer2.tabs.members.addUsersButton).not.toBeVisible();

				await pageForServer2.close();
			});

			test('expect only the room owner being able remove users from the room (user info page)', async ({ browser, page }) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					userFromServer2UsernameOnly,
					constants.RC_SERVER_2.matrixServerName,
				);
				const usernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
					constants.RC_SERVER_1.username,
					constants.RC_SERVER_1.matrixServerName,
				);

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

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroupName}`);

				await expect(poFederationChannelServer1.tabs.btnTabMembers).toBeVisible();
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await (await poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).click();
				await poFederationChannelServer1.tabs.members.btnMenuUserInfo.click();
				await expect(poFederationChannelServer1.tabs.members.btnRemoveUserFromRoom).toBeVisible();

				await expect(poFederationChannelServer2.tabs.btnTabMembers).toBeVisible();
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await (await poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).click();
				await expect(poFederationChannelServer2.tabs.members.btnMenuUserInfo).not.toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.btnRemoveUserFromRoom).not.toBeVisible();

				await pageForServer2.close();
			});

			test('expect only the owner of the room being able to edit the channel name AND the channel topic', async ({ browser, page }) => {
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

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${createdGroupName}`);

				await expect(poFederationChannelServer1.tabs.btnRoomInfo).toBeVisible();
				await poFederationChannelServer1.tabs.btnRoomInfo.click();
				await expect(poFederationChannelServer1.tabs.room.btnEdit).toBeVisible();

				await expect(poFederationChannelServer2.tabs.btnRoomInfo).toBeVisible();
				await poFederationChannelServer2.tabs.btnRoomInfo.click();
				await expect(poFederationChannelServer2.tabs.room.btnEdit).not.toBeVisible();

				await poFederationChannelServer1.tabs.room.btnEdit.click();
				await poFederationChannelServer1.tabs.room.inputName.fill(`NAME-EDITED-${createdGroupName}`);
				await poFederationChannelServer1.tabs.room.btnSave.click();
				await poFederationChannelServer1.tabs.btnRoomInfo.click();
				// waiting for the toast dismiss
				await page.waitForTimeout(3000);

				const nameChangedSystemMessageServer1 = await poFederationChannelServer1.content.getSystemMessageByText(
					`changed room name to NAME-EDITED-${createdGroupName}`,
				);
				await expect(nameChangedSystemMessageServer1).toBeVisible();
				const nameChangedSystemMessageServer2 = await poFederationChannelServer2.content.getSystemMessageByText(
					`changed room name to NAME-EDITED-${createdGroupName}`,
				);
				await expect(nameChangedSystemMessageServer2).toBeVisible();

				await poFederationChannelServer1.tabs.btnRoomInfo.click();
				await poFederationChannelServer1.tabs.room.btnEdit.click();
				await poFederationChannelServer1.tabs.room.inputTopic.fill('hello-topic-edited');
				await poFederationChannelServer1.tabs.room.btnSave.click();

				const topicChangedSystemMessageServer1 = await poFederationChannelServer1.content.getSystemMessageByText(
					'changed room topic to hello-topic-edited',
				);
				await expect(topicChangedSystemMessageServer1).toBeVisible();
				const topicChangedSystemMessageServer2 = await poFederationChannelServer2.content.getSystemMessageByText(
					'changed room topic to hello-topic-edited',
				);
				await expect(topicChangedSystemMessageServer2).toBeVisible();

				await pageForServer2.close();
			});
		});

		test.describe('Removing users from room', () => {
			test('expect to remove the invitee from the room', async ({ browser, page, apiServer2 }) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const groupName = faker.string.uuid();
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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);
				await poFederationChannelServer1.tabs.btnTabMembers.click();
				await poFederationChannelServer1.tabs.members.showAllUsers();

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnTabMembers.click();
				await poFederationChannelServer2.tabs.members.showAllUsers();

				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameFromServer2)).toBeVisible();
				await expect(poFederationChannelServer2.tabs.members.getUserInList(usernameWithDomainFromServer1)).toBeVisible();

				await poFederationChannelServer1.tabs.members.removeUserFromRoom(usernameWithDomainFromServer2);
				const removedSystemMessageServer1 = await poFederationChannelServer1.content.getSystemMessageByText(
					`removed ${usernameWithDomainFromServer2}`,
				);
				await expect(removedSystemMessageServer1).toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(usernameWithDomainFromServer2)).not.toBeVisible();
				await expect(poFederationChannelServer1.tabs.members.getUserInList(constants.RC_SERVER_1.username)).toBeVisible();

				await pageForServer2.close();
			});
		});

		test.describe('Leaving the room', () => {
			test('expect the invitee to be able to leave the room', async ({ browser, page, apiServer2 }) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const groupName = faker.string.uuid();
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

				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer2]);

				await expect(page).toHaveURL(`${constants.RC_SERVER_1.url}/group/${groupName}`);

				await poFederationChannelServer1.sidenav.openChat(groupName);

				await poFederationChannelServer2.sidenav.openChat(groupName);
				await poFederationChannelServer2.tabs.btnRoomInfo.click();
				await expect(poFederationChannelServer2.tabs.room.btnLeave).toBeVisible();

				await poFederationChannelServer2.tabs.room.btnLeave.click();
				await poFederationChannelServer2.tabs.room.btnModalConfirm.click();
				await pageForServer2.close();

				const leftChannelSystemMessageServer1 = await poFederationChannelServer1.content.getSystemMessageByText('left the channel');
				await expect(leftChannelSystemMessageServer1).toBeVisible();
				await expect(await (await poFederationChannelServer1.content.getLastSystemMessageName()).textContent()).toBe(
					usernameWithDomainFromServer2,
				);
			});
		});

		test.describe('Discussions', () => {
			test('expect the federated channels not to be shown as parent channels in discussion creation', async ({ page, browser }) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const channelName = faker.string.uuid();

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: userFromServer2UsernameOnly,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});

				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);
				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);

				await poFederationChannelServer1.createDiscussionSearchingForChannel(channelName);
				await expect(page.locator('div.rcx-option__content', { hasText: 'Empty' })).toBeVisible();
				await poFederationChannelServer2.createDiscussionSearchingForChannel(channelName);
				await expect(pageForServer2.locator('div.rcx-option__content', { hasText: 'Empty' })).toBeVisible();
				await page.reload();
				await pageForServer2.close();
			});
		});

		test.describe('Teams', () => {
			test('expect the federated channels not to be shown as parent channels in the input to add rooms to the team on Server A', async ({
				page,
			}) => {
				const channelName = faker.string.uuid();
				const teamName = faker.string.uuid();

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);

				await poFederationChannelServer1.createTeam(teamName);
				await poFederationChannelServer1.tabs.btnTeam.click();
				await poFederationChannelServer1.tabs.btnAddExistingChannelToTeam.click();
				await poFederationChannelServer1.tabs.searchForChannelOnAddChannelToTeam(channelName);
				await expect(page.locator('div.rcx-option__content', { hasText: 'Empty' })).toBeVisible();
				await page.reload();
			});

			test('expect the federated channels not to be shown as parent channels in the input to add rooms to the team on Server B', async ({
				page,
				browser,
			}) => {
				const pageForServer2 = await browser.newPage();
				const poFederationChannelServer2 = new FederationChannel(pageForServer2);
				const channelName = faker.string.uuid();
				const teamName = faker.string.uuid();

				await doLogin({
					page: pageForServer2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: userFromServer2UsernameOnly,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});

				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);
				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
				await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);

				await poFederationChannelServer2.createTeam(teamName);
				await poFederationChannelServer2.tabs.btnTeam.click();
				await poFederationChannelServer2.tabs.btnAddExistingChannelToTeam.click();
				await poFederationChannelServer2.tabs.searchForChannelOnAddChannelToTeam(channelName);
				await expect(pageForServer2.locator('div.rcx-option__content', { hasText: 'Empty' })).toBeVisible();
				await page.reload();
				await pageForServer2.close();
			});
		});
	});
});
