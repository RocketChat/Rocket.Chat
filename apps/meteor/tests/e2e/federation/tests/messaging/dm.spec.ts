/* eslint no-await-in-loop: 0 */
import type { Page } from '@playwright/test';

import * as constants from '../../config/constants';
import { FederationChannel } from '../../page-objects/channel';
import { doLogin } from '../../utils/auth';
import { formatIntoFullMatrixUsername, formatUsernameAndDomainIntoMatrixFormat } from '../../utils/format';
import { registerUser } from '../../utils/register-user';
import { test, expect, setupTesting, tearDownTesting } from '../../utils/test';

test.describe.parallel('Federation - DM Messaging', () => {
	let poFederationChannelServer1: FederationChannel;
	let poFederationChannelServer2: FederationChannel;
	let userFromServer2UsernameOnly: string;
	let userFromServer1UsernameOnly: string;
	let usernameWithDomainFromServer2: string;
	const adminUsernameWithDomainFromServer1 = formatUsernameAndDomainIntoMatrixFormat(
		constants.RC_SERVER_1.username,
		constants.RC_SERVER_1.matrixServerName,
	);
	let pageForServer2: Page;

	test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
		await setupTesting(apiServer1);
		await setupTesting(apiServer2);
		userFromServer1UsernameOnly = await registerUser(apiServer1);
		userFromServer2UsernameOnly = await registerUser(apiServer2);
		usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
			userFromServer2UsernameOnly,
			constants.RC_SERVER_2.matrixServerName,
		);
		const page = await browser.newPage();
		await doLogin({
			page,
			server: {
				url: constants.RC_SERVER_1.url,
				username: constants.RC_SERVER_1.username,
				password: constants.RC_SERVER_1.password,
			},
		});
		poFederationChannelServer1 = new FederationChannel(page);
		await page.goto(`${constants.RC_SERVER_1.url}/home`);

		const fullUsernameFromServer2 = formatIntoFullMatrixUsername(userFromServer2UsernameOnly, constants.RC_SERVER_2.matrixServerName);
		await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);
		await page.close();
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

	test.describe('Messaging - Direct Messages (DMs)', () => {
		test.describe('Send message', () => {
			test('expect to send a message from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer1.content.sendMessage('hello world from server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('hello world from server A');
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText('hello world from server A');
			});

			test('expect to send a message from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.content.sendMessage('hello world from server B');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('hello world from server B');
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText('hello world from server B');
			});

			test.describe('With multiple users', () => {
				let createdUsernameFromServer2: string;
				let usernameWithDomainFromServer2: string;

				test('expect to send a message from Server A (creator) to Server B', async ({ browser, page, apiServer2 }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);
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
					await doLogin({
						page: page2,
						server: {
							url: constants.RC_SERVER_1.url,
							username: userFromServer1UsernameOnly,
							password: constants.RC_SERVER_1.password,
						},
						storeState: false,
					});
					await page.goto(`${constants.RC_SERVER_1.url}/home`);
					await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

					const fullUsernameFromServer2 = formatIntoFullMatrixUsername(createdUsernameFromServer2, constants.RC_SERVER_2.matrixServerName);
					usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
						createdUsernameFromServer2,
						constants.RC_SERVER_2.matrixServerName,
					);

					await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2, userFromServer1UsernameOnly]);

					await poFederationChannelServer1.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.content.sendMessage('hello world from server A (creator)');

					await poFederationChannelServer2.sidenav.openDMMultipleChat(adminUsernameWithDomainFromServer1);

					await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('hello world from server A (creator)');
					await expect(poFederationChannel1ForUser2.content.lastUserMessageBody).toHaveText('hello world from server A (creator)');
					await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText('hello world from server A (creator)');
					await pageForServer2.close();
					await page2.close();
				});

				test('expect to send a message from Server A (user 2) to Server B', async ({ browser }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

					await doLogin({
						page: pageForServer2,
						server: {
							url: constants.RC_SERVER_2.url,
							username: createdUsernameFromServer2,
							password: constants.RC_SERVER_2.password,
						},
						storeState: false,
					});
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
					await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer1.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer2.sidenav.openDMMultipleChat(adminUsernameWithDomainFromServer1);

					await poFederationChannel1ForUser2.content.sendMessage('hello world from server A (user 2)');
					await poFederationChannel1ForUser2.content.sendMessage('hello world from server A (user 2) message 2');

					await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText('hello world from server A (user 2) message 2');
					await expect(poFederationChannel1ForUser2.content.lastUserMessageBody).toHaveText('hello world from server A (user 2) message 2');
					await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('hello world from server A (user 2) message 2');

					await page2.close();
					await pageForServer2.close();
				});

				test('expect to send a message from Server B to Server A', async ({ page, browser }) => {
					const page2 = await browser.newPage();
					const poFederationChannel1ForUser2 = new FederationChannel(page2);
					const pageForServer2 = await browser.newPage();
					const poFederationChannelServer2 = new FederationChannel(pageForServer2);

					await doLogin({
						page: pageForServer2,
						server: {
							url: constants.RC_SERVER_2.url,
							username: createdUsernameFromServer2,
							password: constants.RC_SERVER_2.password,
						},
						storeState: false,
					});
					await doLogin({
						page: page2,
						server: {
							url: constants.RC_SERVER_1.url,
							username: userFromServer1UsernameOnly,
							password: constants.RC_SERVER_1.password,
						},
						storeState: false,
					});
					await page.goto(`${constants.RC_SERVER_1.url}/home`);
					await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

					await poFederationChannelServer1.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannel1ForUser2.sidenav.openDMMultipleChat(usernameWithDomainFromServer2);
					await poFederationChannelServer2.sidenav.openDMMultipleChat(adminUsernameWithDomainFromServer1);

					await poFederationChannelServer2.content.sendMessage('hello world from server B');

					await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText('hello world from server B');
					await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('hello world from server B');
					await expect(poFederationChannel1ForUser2.content.lastUserMessageBody).toHaveText('hello world from server B');
					await pageForServer2.close();
					await page2.close();
				});
			});
		});

		test.describe('Send "Special" messages', () => {
			test('expect to send a message with emojis from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendMessage('😀 😀 hello world 🌎 from server A with emojis 😀 😀');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText(
					'😀 😀 hello world 🌎 from server A with emojis 😀 😀',
				);
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText(
					'😀 😀 hello world 🌎 from server A with emojis 😀 😀',
				);
			});

			test('expect to send a message with emojis from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer2.content.sendMessage('😀 😀 hello world 🌎 from server B with emojis 😀 😀');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText(
					'😀 😀 hello world 🌎 from server B with emojis 😀 😀',
				);
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText(
					'😀 😀 hello world 🌎 from server B with emojis 😀 😀',
				);
			});

			test('expect to send an audio message from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendAudioRecordedMessage();

				await expect(await (await poFederationChannelServer1.content.getLastFileMessageByFileName('Audio record.mp3')).innerText()).toEqual(
					'Audio record.mp3',
				);
				await expect(await (await poFederationChannelServer2.content.getLastFileMessageByFileName('Audio record.mp3')).innerText()).toEqual(
					'Audio record.mp3',
				);

				await expect(poFederationChannelServer1.content.lastFileMessage.locator('audio')).toBeVisible();
				await expect(poFederationChannelServer2.content.lastFileMessage.locator('audio')).toBeVisible();
			});

			test('expect to send an audio message from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer2.content.sendAudioRecordedMessage();

				await expect(await (await poFederationChannelServer2.content.getLastFileMessageByFileName('Audio record.mp3')).innerText()).toEqual(
					'Audio record.mp3',
				);
				await expect(await (await poFederationChannelServer1.content.getLastFileMessageByFileName('Audio record.mp3')).innerText()).toEqual(
					'Audio record.mp3',
				);

				await expect(poFederationChannelServer2.content.lastFileMessage.locator('audio')).toBeVisible();
				await expect(poFederationChannelServer1.content.lastFileMessage.locator('audio')).toBeVisible();
			});

			test('expect to send a video message from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await page.reload();
				await pageForServer2.reload();

				await poFederationChannelServer1.content.sendVideoRecordedMessage();

				await expect(
					await (await poFederationChannelServer1.content.getLastFileMessageByFileName('Video record.webm')).innerText(),
				).toEqual('Video record.webm');
				await expect(
					await (await poFederationChannelServer2.content.getLastFileMessageByFileName('Video record.webm')).innerText(),
				).toEqual('Video record.webm');

				await expect(poFederationChannelServer1.content.lastFileMessage.locator('video')).toBeVisible();
				await expect(poFederationChannelServer2.content.lastFileMessage.locator('video')).toBeVisible();
			});

			test('expect to send a video message from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await page.reload();
				await pageForServer2.reload();

				await poFederationChannelServer2.content.sendVideoRecordedMessage();

				await expect(
					await (await poFederationChannelServer2.content.getLastFileMessageByFileName('Video record.webm')).innerText(),
				).toEqual('Video record.webm');
				await expect(
					await (await poFederationChannelServer1.content.getLastFileMessageByFileName('Video record.webm')).innerText(),
				).toEqual('Video record.webm');

				await expect(poFederationChannelServer2.content.lastFileMessage.locator('video')).toBeVisible();
				await expect(poFederationChannelServer1.content.lastFileMessage.locator('video')).toBeVisible();
			});

			test('expect to send a file message (image) from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendFileMessage('test_image.jpeg');
				await poFederationChannelServer1.content.btnModalConfirm.click();

				await expect(poFederationChannelServer1.content.lastMessageFileName).toContainText('test_image.jpeg');
				await expect(poFederationChannelServer2.content.lastMessageFileName).toContainText('test_image.jpeg');
			});

			test('expect to send a file message (image) from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer2.content.sendFileMessage('test_image.jpeg');
				await poFederationChannelServer2.content.btnModalConfirm.click();

				await expect(poFederationChannelServer2.content.lastMessageFileName).toContainText('test_image.jpeg');
				await expect(poFederationChannelServer1.content.lastMessageFileName).toContainText('test_image.jpeg');
			});

			test('expect to send a file message (video) from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendFileMessage('test_video.mp4');
				await poFederationChannelServer1.content.btnModalConfirm.click();

				await expect(await (await poFederationChannelServer1.content.getLastFileMessageByFileName('test_video.mp4')).innerText()).toEqual(
					'test_video.mp4',
				);
				await expect(await (await poFederationChannelServer2.content.getLastFileMessageByFileName('test_video.mp4')).innerText()).toEqual(
					'test_video.mp4',
				);

				await expect(poFederationChannelServer1.content.lastFileMessage.locator('video')).toBeVisible();
				await expect(poFederationChannelServer2.content.lastFileMessage.locator('video')).toBeVisible();
			});

			test('expect to send a file message (video) from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer2.content.sendFileMessage('test_video.mp4');
				await poFederationChannelServer2.content.btnModalConfirm.click();

				await expect(await (await poFederationChannelServer2.content.getLastFileMessageByFileName('test_video.mp4')).innerText()).toEqual(
					'test_video.mp4',
				);
				await expect(await (await poFederationChannelServer1.content.getLastFileMessageByFileName('test_video.mp4')).innerText()).toEqual(
					'test_video.mp4',
				);

				await expect(poFederationChannelServer2.content.lastFileMessage.locator('video')).toBeVisible();
				await expect(poFederationChannelServer1.content.lastFileMessage.locator('video')).toBeVisible();
			});

			test('expect to send a file message (pdf) from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendFileMessage('test_pdf_file.pdf');
				await poFederationChannelServer1.content.btnModalConfirm.click();

				await expect(poFederationChannelServer1.content.lastMessageFileName).toContainText('test_pdf_file.pdf');
				await expect(poFederationChannelServer2.content.lastMessageFileName).toContainText('test_pdf_file.pdf');
			});

			test('expect to send a file message (pdf) from Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer2.content.sendFileMessage('test_pdf_file.pdf');
				await poFederationChannelServer2.content.btnModalConfirm.click();

				await expect(poFederationChannelServer2.content.lastMessageFileName).toContainText('test_pdf_file.pdf');
				await expect(poFederationChannelServer1.content.lastMessageFileName).toContainText('test_pdf_file.pdf');
			});

			test('expect to send a message mentioning an user from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.inputMessage.type(`@${userFromServer2UsernameOnly}`, { delay: 100 });
				await poFederationChannelServer1.content.messagePopUpItems
					.locator(`role=listitem >> text="${usernameWithDomainFromServer2}"`)
					.waitFor();
				await expect(
					poFederationChannelServer1.content.messagePopUpItems.locator(`role=listitem >> text="${usernameWithDomainFromServer2}"`),
				).toBeVisible();

				await poFederationChannelServer2.content.inputMessage.type(`@${constants.RC_SERVER_1.username}`, { delay: 100 });
				await poFederationChannelServer2.content.messagePopUpItems
					.locator(`role=listitem >> text="${adminUsernameWithDomainFromServer1}"`)
					.waitFor();
				await expect(
					poFederationChannelServer2.content.messagePopUpItems.locator(`role=listitem >> text="${adminUsernameWithDomainFromServer1}"`),
				).toBeVisible();

				await poFederationChannelServer1.content.inputMessage.fill('');
				await poFederationChannelServer2.content.inputMessage.fill('');

				await poFederationChannelServer1.content.sendMessage(
					`hello @${usernameWithDomainFromServer2}, here's @${constants.RC_SERVER_1.username} from Server A`,
				);

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText(
					`hello ${usernameWithDomainFromServer2}, here's ${constants.RC_SERVER_1.username} from Server A`,
				);
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText(
					`hello ${userFromServer2UsernameOnly}, here's ${adminUsernameWithDomainFromServer1} from Server A`,
				);
			});

			test('expect to send a message mentioning an user Server B to Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.content.sendMessage('hello');
				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);

				await poFederationChannelServer2.content.inputMessage.type(`@${constants.RC_SERVER_1.username}`, { delay: 100 });
				await poFederationChannelServer2.content.messagePopUpItems
					.locator(`role=listitem >> text="${adminUsernameWithDomainFromServer1}"`)
					.waitFor();
				await expect(
					poFederationChannelServer2.content.messagePopUpItems.locator(`role=listitem >> text="${adminUsernameWithDomainFromServer1}"`),
				).toBeVisible();

				await poFederationChannelServer1.content.inputMessage.type(`@${userFromServer2UsernameOnly}`, { delay: 100 });
				await poFederationChannelServer1.content.messagePopUpItems
					.locator(`role=listitem >> text="${usernameWithDomainFromServer2}"`)
					.waitFor();
				await expect(
					poFederationChannelServer1.content.messagePopUpItems.locator(`role=listitem >> text="${usernameWithDomainFromServer2}"`),
				).toBeVisible();

				await poFederationChannelServer1.content.inputMessage.fill('');
				await poFederationChannelServer2.content.inputMessage.fill('');

				await poFederationChannelServer2.content.sendMessage(
					`hello @${adminUsernameWithDomainFromServer1}, here's @${userFromServer2UsernameOnly} from Server B`,
				);

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText(
					`hello ${constants.RC_SERVER_1.username}, here's ${usernameWithDomainFromServer2} from Server B`,
				);
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText(
					`hello ${adminUsernameWithDomainFromServer1}, here's ${userFromServer2UsernameOnly} from Server B`,
				);
			});

			test('expect to send a message with multiple mentions, including @all from Server A to Server B', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer1.content.sendMessage(
					`hello @${usernameWithDomainFromServer2}, here's @${constants.RC_SERVER_1.username} from Server A, @all, @${usernameWithDomainFromServer2}`,
				);

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText(
					`hello ${usernameWithDomainFromServer2}, here's ${constants.RC_SERVER_1.username} from Server A, all, ${usernameWithDomainFromServer2}`,
				);
				await expect(poFederationChannelServer2.content.lastUserMessageBody).toHaveText(
					`hello ${userFromServer2UsernameOnly}, here's ${adminUsernameWithDomainFromServer1} from Server A, all, ${userFromServer2UsernameOnly}`,
				);
			});
		});

		test.describe('Message actions', () => {
			test('expect to send a message quoting a message from Server A to Server B', async ({ browser, apiServer2, page }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);
				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				const message = `Message for quote - ${Date.now()}`;

				await poFederationChannelServer1.content.sendMessageUsingEnter(message);
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer1.content.quoteMessage('this is a quote message');

				await expect(poFederationChannelServer1.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
				await expect(poFederationChannelServerUser2.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
				await page2.close();
			});

			test('expect to send a message quoting a message Server B to Server A', async ({ browser, apiServer2, page }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);
				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				const message = `Message for quote - ${Date.now()}`;

				await poFederationChannelServer1.content.sendMessageUsingEnter(message);
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServerUser2.content.quoteMessage('this is a quote message');

				await expect(poFederationChannelServerUser2.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
				await expect(poFederationChannelServer1.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
				await page2.close();
			});

			test('expect to react a message from Server A to Server B', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.reactToMessage('slight_smile');

				const reactionsServer1 = await poFederationChannelServer1.content.getAllReactions();
				const reactionListExcludingTheActionServer1 = (await reactionsServer1.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer1; i++) {
					await expect(reactionsServer1.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText('🙂');
					await expect(reactionsServer1.nth(i).locator('div.rcx-message-reactions__counter')).toContainText('1');
				}
				const reactionsServer2 = await poFederationChannelServerUser2.content.getAllReactions();
				const reactionListExcludingTheActionServer2 = (await reactionsServer2.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer2; i++) {
					await expect(reactionsServer2.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText('🙂');
					await expect(reactionsServer2.nth(i).locator('div.rcx-message-reactions__counter')).toContainText('1');
				}
				await page2.close();
			});

			test('expect to react a message from Server B to Server A', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServerUser2.content.reactToMessage('slight_smile');

				const reactionsServer1 = await poFederationChannelServer1.content.getAllReactions();
				const reactionListExcludingTheActionServer1 = (await reactionsServer1.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer1; i++) {
					await expect(reactionsServer1.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText('🙂');
					await expect(reactionsServer1.nth(i).locator('div.rcx-message-reactions__counter')).toContainText('1');
				}
				const reactionsServer2 = await poFederationChannelServerUser2.content.getAllReactions();
				const reactionListExcludingTheActionServer2 = (await reactionsServer2.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer2; i++) {
					await expect(reactionsServer2.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText('🙂');
					await expect(reactionsServer2.nth(i).locator('div.rcx-message-reactions__counter')).toContainText('1');
				}
				await page2.close();
			});

			test('expect to unreact a message from Server A to Server B', async ({ page, apiServer2 }) => {
				await poFederationChannelServer2.sidenav.logout();
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
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.reactToMessage('slight_smile');
				await poFederationChannelServer1.content.reactToMessage('grin');

				let reactionsServer1 = await poFederationChannelServer1.content.getAllReactions();
				let reactionListExcludingTheActionServer1 = (await reactionsServer1.count()) - 1;
				const reactionsMap: any = {
					0: {
						emoji: '🙂',
						count: '1',
					},
					1: {
						emoji: '😁',
						count: '1',
					},
				};
				for (let i = 0; i < reactionListExcludingTheActionServer1; i++) {
					await expect(reactionsServer1.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(reactionsMap[i].emoji);
					await expect(reactionsServer1.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(reactionsMap[i].count);
				}
				let reactionsServer2 = await poFederationChannelServer2.content.getAllReactions();
				let reactionListExcludingTheActionServer2 = (await reactionsServer2.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer2; i++) {
					await expect(reactionsServer2.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(reactionsMap[i].emoji);
					await expect(reactionsServer2.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(reactionsMap[i].count);
				}

				await poFederationChannelServer1.content.unreactLastMessage();
				await pageForServer2.reload({ waitUntil: 'domcontentloaded' });

				reactionsServer1 = await poFederationChannelServer1.content.getAllReactions();
				reactionListExcludingTheActionServer1 = (await reactionsServer1.count()) - 1;

				const reactionsMapAfterUnreaction: any = {
					0: {
						emoji: '🙂',
						count: '1',
					},
				};
				for (let i = 0; i < reactionListExcludingTheActionServer1; i++) {
					await expect(reactionsServer1.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(
						reactionsMapAfterUnreaction[i].emoji,
					);
					await expect(reactionsServer1.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(
						reactionsMapAfterUnreaction[i].count,
					);
				}
				reactionsServer2 = await poFederationChannelServer2.content.getAllReactions();
				reactionListExcludingTheActionServer2 = (await reactionsServer2.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer2; i++) {
					await expect(reactionsServer2.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(
						reactionsMapAfterUnreaction[i].emoji,
					);
					await expect(reactionsServer2.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(
						reactionsMapAfterUnreaction[i].count,
					);
				}
			});

			test('expect to unreact a message from Server B to Server A', async ({ page, apiServer2 }) => {
				await poFederationChannelServer2.sidenav.logout();
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
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');
				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer2.content.reactToMessage('slight_smile');
				await poFederationChannelServer2.content.reactToMessage('grin');

				let reactionsServer2 = await poFederationChannelServer2.content.getAllReactions();
				let reactionListExcludingTheActionServer2 = (await reactionsServer2.count()) - 1;
				const reactionsMap: any = {
					0: {
						emoji: '🙂',
						count: '1',
					},
					1: {
						emoji: '😁',
						count: '1',
					},
				};
				for (let i = 0; i < reactionListExcludingTheActionServer2; i++) {
					await expect(reactionsServer2.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(reactionsMap[i].emoji);
					await expect(reactionsServer2.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(reactionsMap[i].count);
				}
				let reactionsServer1 = await poFederationChannelServer1.content.getAllReactions();
				let reactionListExcludingTheActionServer1 = (await reactionsServer1.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer1; i++) {
					await expect(reactionsServer1.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(reactionsMap[i].emoji);
					await expect(reactionsServer1.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(reactionsMap[i].count);
				}

				await poFederationChannelServer2.content.unreactLastMessage();
				await pageForServer2.reload({ waitUntil: 'domcontentloaded' });

				reactionsServer2 = await poFederationChannelServer2.content.getAllReactions();
				reactionListExcludingTheActionServer2 = (await reactionsServer2.count()) - 1;

				const reactionsMapAfterUnreaction: any = {
					0: {
						emoji: '🙂',
						count: '1',
					},
				};
				for (let i = 0; i < reactionListExcludingTheActionServer2; i++) {
					await expect(reactionsServer2.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(
						reactionsMapAfterUnreaction[i].emoji,
					);
					await expect(reactionsServer2.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(
						reactionsMapAfterUnreaction[i].count,
					);
				}
				reactionsServer1 = await poFederationChannelServer1.content.getAllReactions();
				reactionListExcludingTheActionServer1 = (await reactionsServer1.count()) - 1;
				for (let i = 0; i < reactionListExcludingTheActionServer1; i++) {
					await expect(reactionsServer1.nth(i).locator('span.rcx-message-reactions__emoji.emojione')).toContainText(
						reactionsMapAfterUnreaction[i].emoji,
					);
					await expect(reactionsServer1.nth(i).locator('div.rcx-message-reactions__counter')).toContainText(
						reactionsMapAfterUnreaction[i].count,
					);
				}
			});

			test('expect to edit a message from Server A to Server B', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServer1.content.editLastMessage('message from Server A - Edited');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A - Edited');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A - Edited');
				await page2.close();
			});

			test('expect to edit a message from Server B to Server A', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServerUser2.content.sendMessageUsingEnter('message from Server B');

				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server B');
				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server B');

				await poFederationChannelServerUser2.content.editLastMessage('message from Server B - Edited');

				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server B - Edited');
				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server B - Edited');
				await page2.close();
			});

			test('expect to delete a message from Server A to Server B', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServer1.content.deleteLastMessage();
				await expect(poFederationChannelServer1.toastSuccess).toBeVisible();

				await expect(poFederationChannelServer1.content.lastUserMessage).not.toBeVisible();
				await expect(poFederationChannelServerUser2.content.lastUserMessage).not.toBeVisible();
				await page2.close();
			});

			test('expect to delete a message from Server B to Server A', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServer1.content.deleteLastMessage();
				await page.waitForTimeout(2000);
				await poFederationChannelServerUser2.content.sendMessageUsingEnter('message from Server B');
				await poFederationChannelServerUser2.content.deleteLastMessage();
				await expect(poFederationChannelServerUser2.toastSuccess).toBeVisible();

				await expect(poFederationChannelServer1.content.lastUserMessage).not.toBeVisible();
				await expect(poFederationChannelServerUser2.content.lastUserMessage).not.toBeVisible();
				await page2.close();
			});

			test('expect to star a message on Server A', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServer1.content.starLastMessage();
				await expect(
					poFederationChannelServer1.toastSuccess.locator('div.rcx-toastbar-content', { hasText: 'Message has been starred' }),
				).toBeVisible();

				await expect(poFederationChannelServer1.content.lastUserMessage.locator('.rcx-icon--name-star-filled')).toBeVisible();
				await page2.close();
			});

			test('expect to star a message on Server B', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServerUser2.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServerUser2.content.starLastMessage();
				await expect(
					poFederationChannelServerUser2.toastSuccess.locator('div.rcx-toastbar-content', { hasText: 'Message has been starred' }),
				).toBeVisible();

				await expect(poFederationChannelServerUser2.content.lastUserMessage.locator('.rcx-icon--name-star-filled')).toBeVisible();
				await page2.close();
			});

			test('expect to not be able to start a discussion from a message in Server A', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServer1.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await expect(poFederationChannelServer1.content.btnOptionStartDiscussion).not.toBeVisible();
				await page2.close();
			});

			test('expect to not be able to start a discussion from a message in Server B', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServerUser2.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServerUser2.content.openLastMessageMenu();
				await expect(poFederationChannelServerUser2.content.btnOptionStartDiscussion).not.toBeVisible();
				await page2.close();
			});

			test('expect to not be able to pin a message in Server A', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);

				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServerUser2.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServer1.content.openLastMessageMenu();
				await expect(poFederationChannelServer1.content.btnOptionPinMessage).not.toBeVisible();
				await page2.close();
			});

			test('expect to not be able to pin a message in Server B', async ({ browser, page, apiServer2 }) => {
				const page2 = await browser.newPage();
				const poFederationChannelServerUser2 = new FederationChannel(page2);
				const usernameFromServer2 = await registerUser(apiServer2);

				await doLogin({
					page: page2,
					server: {
						url: constants.RC_SERVER_2.url,
						username: usernameFromServer2,
						password: constants.RC_SERVER_2.password,
					},
					storeState: false,
				});
				await page.goto(`${constants.RC_SERVER_1.url}/home`);
				await page2.goto(`${constants.RC_SERVER_2.url}/home`);
				const fullUsernameFromServer2 = formatIntoFullMatrixUsername(usernameFromServer2, constants.RC_SERVER_2.matrixServerName);
				const usernameWithDomainFromServer2 = formatUsernameAndDomainIntoMatrixFormat(
					usernameFromServer2,
					constants.RC_SERVER_2.matrixServerName,
				);
				await poFederationChannelServer1.createDirectMessagesUsingModal([fullUsernameFromServer2]);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.content.sendMessage('message');
				await poFederationChannelServerUser2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await poFederationChannelServerUser2.content.sendMessageUsingEnter('message from Server A');

				await expect(poFederationChannelServer1.content.lastUserMessageBody).toHaveText('message from Server A');
				await expect(poFederationChannelServerUser2.content.lastUserMessageBody).toHaveText('message from Server A');

				await poFederationChannelServerUser2.content.openLastMessageMenu();
				await expect(poFederationChannelServerUser2.content.btnOptionPinMessage).not.toBeVisible();
				await page2.close();
			});
		});

		test.describe('Visual Elements', () => {
			test('expect to see the file list sent in the DM on Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);

				await expect(poFederationChannelServer1.tabs.btnFileList).toBeVisible();
			});

			test('expect to see the file list sent in the DM on Server B', async () => {
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);

				await expect(poFederationChannelServer2.tabs.btnFileList).toBeVisible();
			});

			test('expect to see all the starred messages sent in the DM on Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.kebab.click();

				await expect(poFederationChannelServer1.tabs.btnStarredMessagesList).toBeVisible();
			});

			test('expect to see all the starred messages sent in the DM on Server B', async () => {
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.kebab.click();

				await expect(poFederationChannelServer2.tabs.btnStarredMessagesList).toBeVisible();
			});

			test('expect to not to see the pinned messages sent in the DM on Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.kebab.click();

				await expect(poFederationChannelServer1.tabs.btnPinnedMessagesList).not.toBeVisible();
			});

			test('expect to not to see the pinned messages sent in the DM on Server B', async () => {
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.kebab.click();

				await expect(poFederationChannelServer2.tabs.btnPinnedMessagesList).not.toBeVisible();
			});

			test('expect to not be able to prune messages sent in the DM on Server A', async ({ page }) => {
				await page.goto(`${constants.RC_SERVER_1.url}/home`);

				await poFederationChannelServer1.sidenav.openChat(usernameWithDomainFromServer2);
				await poFederationChannelServer1.tabs.kebab.click();

				await expect(poFederationChannelServer1.tabs.btnPruneMessages).not.toBeVisible();
			});

			test('expect to not be able to prune messages sent in the DM on Server B', async () => {
				await pageForServer2.goto(`${constants.RC_SERVER_2.url}/home`);

				await poFederationChannelServer2.sidenav.openChat(adminUsernameWithDomainFromServer1);
				await poFederationChannelServer2.tabs.kebab.click();

				await expect(poFederationChannelServer2.tabs.btnPruneMessages).not.toBeVisible();
			});
		});
	});
});
