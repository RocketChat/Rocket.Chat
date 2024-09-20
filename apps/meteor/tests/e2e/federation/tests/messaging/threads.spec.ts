/* eslint no-await-in-loop: 0 */
import type { Page } from '@playwright/test';

import * as constants from '../../config/constants';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { createGroupAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.only('Federation - Threads', () => {
	let poFederationChannelServer1: FederationChannel;
	let poFederationChannelServer2: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let createdGroupName: string;
	let usernameWithDomainFromServer2: string;
	const adminUsernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
		constants.RC_SERVER_1.username,
		constants.RC_SERVER_1.matrixServerName,
	);
	let pageForServer2: Page;

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

	test.beforeEach(async ({ page, browser }) => {
		pageForServer2 = await browser.newPage();

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
		await page.close();
		await pageForServer2.close();
	});

	test.describe('Messaging - Threads', () => {
		test.describe('Create thread message', () => {
			test('expect to send a thread message from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer1.content.sendMessage('hello world from server A');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await expect(pageForServer2).toHaveURL(/.*thread/);

				await expect(poFederationChannelServer2.content.threadSendToChannelAlso()).not.toBeVisible();

				await poFederationChannelServer2.content.sendThreadMessage('This is a thread message sent from server B');

				await expect(poFederationChannelServer2.content.lastThreadMessageText).toContainText('This is a thread message sent from server B');
				await expect(poFederationChannelServer2.content.lastUserMessage).toContainText('This is a thread message sent from server B');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await expect(page).toHaveURL(/.*thread/);
				await expect(poFederationChannelServer1.content.lastThreadMessageText).toContainText('This is a thread message sent from server B');
			});

			test('expect to send a thread message from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.content.sendMessage('hello world from server B');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await expect(page).toHaveURL(/.*thread/);

				await expect(poFederationChannelServer1.content.threadSendToChannelAlso()).not.toBeVisible();

				await poFederationChannelServer1.content.sendThreadMessage('This is a thread message sent from server A');

				await expect(poFederationChannelServer1.content.lastThreadMessageText).toContainText('This is a thread message sent from server A');
				await expect(poFederationChannelServer1.content.lastUserMessage).toContainText('This is a thread message sent from server A');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await expect(pageForServer2).toHaveURL(/.*thread/);
				await expect(poFederationChannelServer2.content.lastThreadMessageText).toContainText('This is a thread message sent from server A');
			});
		});

		test.describe('Send "Special" messages', () => {
			test('expect to send a thread message with emojis from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer1.content.sendMessage('hello world from server A');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await poFederationChannelServer2.content.sendThreadMessage('😀 😀 hello world 🌎 from server B with emojis 😀 😀');

				await expect(poFederationChannelServer2.content.lastThreadMessageText).toContainText(
					'😀 😀 hello world 🌎 from server B with emojis 😀 😀',
				);
				await expect(poFederationChannelServer2.content.lastUserMessage).toContainText(
					'😀 😀 hello world 🌎 from server B with emojis 😀 😀',
				);

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await expect(poFederationChannelServer1.content.lastThreadMessageText).toContainText(
					'😀 😀 hello world 🌎 from server B with emojis 😀 😀',
				);
			});

			test('expect to send a thread message with emojis from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.content.sendMessage('hello world from server B');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await poFederationChannelServer1.content.sendThreadMessage('😀 😀 hello world 🌎 from server A with emojis 😀 😀');

				await expect(poFederationChannelServer1.content.lastThreadMessageText).toContainText(
					'😀 😀 hello world 🌎 from server A with emojis 😀 😀',
				);
				await expect(poFederationChannelServer1.content.lastUserMessage).toContainText(
					'😀 😀 hello world 🌎 from server A with emojis 😀 😀',
				);

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await expect(poFederationChannelServer2.content.lastThreadMessageText).toContainText(
					'😀 😀 hello world 🌎 from server A with emojis 😀 😀',
				);
			});

			test('expect to send an audio message from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer1.content.sendMessage('hello world from server A');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await poFederationChannelServer2.content.sendAudioRecordedInThreadMessage();

				await expect(
					await (await poFederationChannelServer2.content.getLastFileThreadMessageByFileName('Audio record.mp3')).innerText(),
				).toEqual('Audio record.mp3');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await expect(
					await (await poFederationChannelServer1.content.getLastFileThreadMessageByFileName('Audio record.mp3')).innerText(),
				).toEqual('Audio record.mp3');
			});

			test('expect to send an audio message from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.content.sendMessage('hello world from server B');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await poFederationChannelServer1.content.sendAudioRecordedInThreadMessage();

				await expect(
					await (await poFederationChannelServer1.content.getLastFileThreadMessageByFileName('Audio record.mp3')).innerText(),
				).toEqual('Audio record.mp3');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await expect(
					await (await poFederationChannelServer2.content.getLastFileThreadMessageByFileName('Audio record.mp3')).innerText(),
				).toEqual('Audio record.mp3');
			});

			test('expect to send a thread message mentioning an user from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer1.content.sendMessage('hello world from server A');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await poFederationChannelServer2.content.sendThreadMessage(
					`hello @${adminUsernameWithDomainFromServer1}, here's @${userFromServer2UsernameOnly} from Server B`,
				);

				await expect(poFederationChannelServer2.content.lastThreadMessageText).toContainText(
					`hello ${adminUsernameWithDomainFromServer1}, here's ${userFromServer2UsernameOnly} from Server B`,
				);

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await expect(poFederationChannelServer1.content.lastThreadMessageText).toContainText(
					`hello ${constants.RC_SERVER_1.username}, here's ${usernameWithDomainFromServer2} from Server B`,
				);
			});

			test('expect to send a thread message mentioning an user Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.content.sendMessage('hello world from server B');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await poFederationChannelServer1.content.sendThreadMessage(
					`hello @${usernameWithDomainFromServer2}, here's @${constants.RC_SERVER_1.username} from Server A`,
				);

				await expect(poFederationChannelServer1.content.lastThreadMessageText).toContainText(
					`hello ${usernameWithDomainFromServer2}, here's ${constants.RC_SERVER_1.username} from Server A`,
				);

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await expect(poFederationChannelServer2.content.lastThreadMessageText).toContainText(
					`hello ${userFromServer2UsernameOnly}, here's ${adminUsernameWithDomainFromServer1} from Server A`,
				);
			});
		});

		test.describe('Message actions', () => {
			test('expect to send a thread message quoting a thread message from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				const message = `Message for quote - ${Date.now()}`;
				await poFederationChannelServer1.content.sendMessage('hello world from server A');

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await poFederationChannelServer2.content.sendThreadMessage(message);

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await poFederationChannelServer1.content.quoteMessageInsideThread('this is a quote message');

				await expect(poFederationChannelServer1.content.waitForLastThreadMessageTextAttachmentEqualsText).toContainText(message);
				await expect(poFederationChannelServer2.content.waitForLastThreadMessageTextAttachmentEqualsText).toContainText(message);
			});

			test('expect to send a thread message quoting a thread message Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);
				await poFederationChannelServer1.sidenav.openChat(createdGroupName);
				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				const message = `Message for quote - ${Date.now()}`;
				await poFederationChannelServer2.content.sendMessage('hello world from server B');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await poFederationChannelServer1.content.btnOptionReplyInThread.click();

				await poFederationChannelServer1.content.sendThreadMessage(message);

				await poFederationChannelServer2.content.openLastMessageMenu();
				await poFederationChannelServer2.content.btnOptionReplyInThread.click();

				await poFederationChannelServer2.content.quoteMessageInsideThread('this is a quote message');

				await expect(poFederationChannelServer1.content.waitForLastThreadMessageTextAttachmentEqualsText).toContainText(message);
				await expect(poFederationChannelServer2.content.waitForLastThreadMessageTextAttachmentEqualsText).toContainText(message);
			});
		});

		test.describe('Visual Elements', () => {
			test('expect to see the thread list sent in the group on Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(createdGroupName);

				await expect(poFederationChannelServer1.tabs.btnThread).toBeVisible();
			});

			test('expect to see the thread list sent in the group on Server B', async () => {
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer2.sidenav.openChat(createdGroupName);

				await expect(poFederationChannelServer2.tabs.btnThread).toBeVisible();
			});
		});
	});
});
