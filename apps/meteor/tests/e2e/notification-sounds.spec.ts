import type { Page } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannelAndReturnFullRoom, deleteRoom, setUserPreferences } from './utils';
import { test, expect } from './utils/test';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		__audioCalls: { src?: string; played?: boolean };
	}
}

test.use({ storageState: Users.admin.state });

test.describe.serial('Notification Sounds', () => {
	let targetChannel: string;
	let targetChannelId: string;
	let poHomeChannel: HomeChannel;
	let user1Page: Page;

	test.beforeAll(async ({ api }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, {
			members: [Users.admin.data.username, Users.user1.data.username],
		});
		targetChannel = channel.name as string;
		targetChannelId = channel._id;
	});

	test.afterAll(async ({ api }) => {
		await deleteRoom(api, targetChannel);
	});

	test.beforeEach(async ({ page, browser }) => {
		poHomeChannel = new HomeChannel(page);
		user1Page = await browser.newPage({ storageState: Users.user1.state });
		await page.goto(`/channel/${targetChannel}`);

		await page.evaluate(() => {
			Audio.prototype.play = ((fn) =>
				function (this: HTMLAudioElement, ...args: unknown[]) {
					window.__audioCalls = { src: this.src, played: false };
					const ret = fn.call(this, ...args);
					window.__audioCalls.played = true;
					return ret;
				})(Audio.prototype.play);
		});
	});

	test.afterEach(async () => {
		await user1Page.close();
	});

	test('should play default notification sounds', async ({ page }) => {
		await user1Page.goto(`/channel/${targetChannel}`);
		const user1PoHomeChannel = new HomeChannel(user1Page);
		await user1PoHomeChannel.content.waitForChannel();

		await poHomeChannel.navbar.btnHome.click();

		await user1PoHomeChannel.content.sendMessage(`Hello @${Users.admin.data.username} from User 1`);

		await page.waitForTimeout(100); // wait for the sound to play

		const audioCalls = await page.evaluate(() => window.__audioCalls);
		expect(audioCalls).toHaveProperty('src');
		expect(audioCalls.src).toContain('chime');
		expect(audioCalls.played).toBe(true);
	});

	test.describe('Notification sound preferences', () => {
		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, {
				newMessageNotification: 'ringtone',
			});
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, {
				newMessageNotification: 'chime',
			});
		});

		test('should play notification sound based on user preferences', async ({ page }) => {
			await user1Page.goto(`/channel/${targetChannel}`);
			const user1PoHomeChannel = new HomeChannel(user1Page);
			await user1PoHomeChannel.content.waitForChannel();

			await poHomeChannel.navbar.btnHome.click();

			await user1PoHomeChannel.content.sendMessage(`Hello @${Users.admin.data.username} from User 1`);

			await page.waitForTimeout(100); // wait for the sound to play

			const audioCalls = await page.evaluate(() => window.__audioCalls);
			expect(audioCalls).toHaveProperty('src');
			expect(audioCalls.src).toContain('ringtone');
			expect(audioCalls.played).toBe(true);
		});
	});

	test.describe('Custom room notification preferences', () => {
		test.beforeEach(async ({ api }) => {
			await api.post('/rooms.saveNotification', {
				roomId: targetChannelId,
				notifications: {
					audioNotificationValue: 'door',
				},
			});
		});

		test('should play custom room notification sound', async ({ page }) => {
			await user1Page.goto(`/channel/${targetChannel}`);
			const user1PoHomeChannel = new HomeChannel(user1Page);
			await user1PoHomeChannel.content.waitForChannel();

			await poHomeChannel.navbar.btnHome.click();

			await user1PoHomeChannel.content.sendMessage(`Hello @${Users.admin.data.username} from User 1`);

			await page.waitForTimeout(100); // wait for the sound to play

			const audioCalls = await page.evaluate(() => window.__audioCalls);
			expect(audioCalls).toHaveProperty('src');
			expect(audioCalls.src).toContain('door');
			expect(audioCalls.played).toBe(true);
		});
	});

	test.describe('none sound notification preferences', () => {
		test.beforeEach(async ({ api }) => {
			await api.post('/rooms.saveNotification', {
				roomId: targetChannelId,
				notifications: {
					audioNotificationValue: 'none',
				},
			});
		});

		test('should not play any notification sound', async ({ page }) => {
			await user1Page.goto(`/channel/${targetChannel}`);
			const user1PoHomeChannel = new HomeChannel(user1Page);
			await user1PoHomeChannel.content.waitForChannel();

			await poHomeChannel.navbar.btnHome.click();

			await user1PoHomeChannel.content.sendMessage(`Hello @${Users.admin.data.username} from User 1`);

			await page.waitForTimeout(100); // wait for the sound to play

			const audioCalls = await page.evaluate(() => window.__audioCalls);
			expect(audioCalls).toBeUndefined();
		});
	});
});
