import type { Page } from '@playwright/test';
import { MongoClient } from 'mongodb';

import { DEFAULT_USER_CREDENTIALS, URL_MONGODB } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import type { IUserState } from './fixtures/userStates';
import { Authenticated, HomeChannel, Login } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser, loginTestUser } from './utils/user-helpers';

const removeTokensFromdb = async (username: string): Promise<void> => {
	const connection = await MongoClient.connect(URL_MONGODB);

	await connection
		.db()
		.collection('users')
		.updateOne({ username }, { $set: { 'services.resume.loginTokens': [] } });

	await connection.close();
};

test.describe('Session Expiration Redirect', () => {
	let targetChannel: string;
	let sessions: { page: Page; poHomeChannel: HomeChannel }[] = [];
	let expiringUser1: ITestUser;
	let expiringUser2: ITestUser;
	let expiringUser1State: IUserState;
	let expiringUser2State: IUserState;
	let recreatedUser: ITestUser | undefined;

	test.beforeAll(async ({ api }) => {
		[expiringUser1, expiringUser2] = await Promise.all([createTestUser(api), createTestUser(api)]);
		[expiringUser1State, expiringUser2State] = await Promise.all([loginTestUser(api, expiringUser1), loginTestUser(api, expiringUser2)]);

		targetChannel = await createTargetChannel(api, { members: [expiringUser1.data.username, expiringUser2.data.username] });
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
		await Promise.all([expiringUser1?.delete(), expiringUser2?.delete(), recreatedUser?.delete()]);
	});

	test.afterEach(async () => {
		await Promise.all(sessions.map(({ page }) => page.close()));
		sessions = [];
	});

	test('should redirect to login page when server-side token is deleted and user tries to interact', async ({ browser }) => {
		const { page } = await createAuxContext(browser, expiringUser1State, `/channel/${targetChannel}`);
		const poHomeChannel = new HomeChannel(page);
		sessions.push({ page, poHomeChannel });

		await test.step('expect user to be logged in initially', async () => {
			await poHomeChannel.content.waitForChannel();
			await expect(page.locator('#main-content')).toBeVisible();

			const userId = await page.evaluate(() => localStorage.getItem('Meteor.userId'));
			const loginToken = await page.evaluate(() => localStorage.getItem('Meteor.loginToken'));
			expect(userId).not.toBeNull();
			expect(loginToken).not.toBeNull();
		});

		await test.step('delete login tokens from database (simulating server-side expiration)', async () => {
			await removeTokensFromdb(expiringUser1.data.username);
		});

		await test.step('open room search messages (without page reload)', async () => {
			await poHomeChannel.roomToolbar.btnSearchMessages.click();
		});

		await test.step('should redirect to login page', async () => {
			await expect(page.getByRole('form', { name: 'Login' })).toBeVisible();
		});

		await test.step('verify localStorage was cleared', async () => {
			const userId = await page.evaluate(() => localStorage.getItem('Meteor.userId'));
			const loginToken = await page.evaluate(() => localStorage.getItem('Meteor.loginToken'));
			const loginTokenExpires = await page.evaluate(() => localStorage.getItem('Meteor.loginTokenExpires'));

			expect(userId).toBeNull();
			expect(loginToken).toBeNull();
			expect(loginTokenExpires).toBeNull();
		});
	});

	test('should redirect to login page when trying to send message with expired token', async ({ browser }) => {
		const { page } = await createAuxContext(browser, expiringUser2State, `/channel/${targetChannel}`);
		const poHomeChannel = new HomeChannel(page);
		sessions.push({ page, poHomeChannel });

		await test.step('type message', async () => {
			await poHomeChannel.content.waitForChannel();
			await poHomeChannel.composer.inputMessage.fill('Test message');
		});

		await test.step('delete login tokens from database', async () => {
			await removeTokensFromdb(expiringUser2.data.username);
		});

		await test.step('try to send a message (should trigger auth error)', async () => {
			await poHomeChannel.composer.btnSend.click();
		});

		await test.step('expect automatic redirect to login page', async () => {
			await expect(page.getByRole('form', { name: 'Login' })).toBeVisible();
		});

		await test.step('verify localStorage was cleared', async () => {
			const userId = await page.evaluate(() => localStorage.getItem('Meteor.userId'));
			const loginToken = await page.evaluate(() => localStorage.getItem('Meteor.loginToken'));
			expect(userId).toBeNull();
			expect(loginToken).toBeNull();
		});
	});

	test('should log back in as a recreated user at the first attempt, on the same page, after the logged-in user is deleted', async ({
		api,
		browser,
	}) => {
		recreatedUser = await createTestUser(api);
		const { username } = recreatedUser.data;
		const { page } = await createAuxContext(browser, await loginTestUser(api, recreatedUser), '/home');
		const poHomeChannel = new HomeChannel(page);
		const poLogin = new Login(page);
		sessions.push({ page, poHomeChannel });

		await test.step('delete the logged-in user', async () => {
			await recreatedUser?.delete();
			await poLogin.waitForDisplay();
		});

		await test.step('verify localStorage was cleared', async () => {
			const userId = await page.evaluate(() => localStorage.getItem('Meteor.userId'));
			const loginToken = await page.evaluate(() => localStorage.getItem('Meteor.loginToken'));

			expect(userId).toBeNull();
			expect(loginToken).toBeNull();
		});

		await test.step('recreate the user and log in on the same page, without reloading', async () => {
			recreatedUser = await createTestUser(api, { username });
			await poLogin.login(username, DEFAULT_USER_CREDENTIALS.password);

			await new Authenticated(page).waitForDisplay();
		});
	});
});
