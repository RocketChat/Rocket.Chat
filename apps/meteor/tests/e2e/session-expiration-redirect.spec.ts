import { MongoClient } from 'mongodb';

import { URL_MONGODB } from './config/constants';
import injectInitialData from './fixtures/inject-initial-data';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

const removeTokensFromdb = async (username: string): Promise<void> => {
	const connection = await MongoClient.connect(URL_MONGODB);

	await connection
		.db()
		.collection('users')
		.updateOne({ username }, { $set: { 'services.resume.loginTokens': [] } });

	await connection.close();
};

test.use({ storageState: Users.user1.state });

test.describe('Session Expiration Redirect', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: [Users.user1.data.username] });
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
	});
	test.afterEach(async () => {
		await injectInitialData();
	});

	test('should redirect to login page when server-side token is deleted and user tries to interact', async ({ page }) => {
		await test.step('expect user to be logged in initially', async () => {
			await expect(page.locator('#main-content')).toBeVisible();

			const userId = await page.evaluate(() => localStorage.getItem('Meteor.userId'));
			const loginToken = await page.evaluate(() => localStorage.getItem('Meteor.loginToken'));
			expect(userId).not.toBeNull();
			expect(loginToken).not.toBeNull();
		});

		await test.step('delete login tokens from database (simulating server-side expiration)', async () => {
			await removeTokensFromdb(Users.user1.data.username);
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

	test('should redirect to login page when trying to send message with expired token', async ({ page }) => {
		await test.step('type message', async () => {
			await poHomeChannel.composer.inputMessage.fill('Test message');
		});

		await test.step('delete login tokens from database', async () => {
			await removeTokensFromdb(Users.user1.data.username);
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
});
