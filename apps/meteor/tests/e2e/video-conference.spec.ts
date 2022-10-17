import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetTeam, createDirectMessage } from './utils';

test.use({ storageState: 'user1-session.json' });

test.describe('video conference', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetTeam: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetTeam = await createTargetTeam(api);
		await createDirectMessage(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect create video conference in a channel', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();
		await expect(poHomeChannel.content.btnJoinCall).toBeVisible();
	});
	test('expect create video conference in a direct', async () => {
		await poHomeChannel.sidenav.openChat('user2');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();
		await expect(poHomeChannel.content.btnJoinCall.last()).toBeVisible();
	});

	test.describe('video conference in a direct', async () => {
		test.use({ storageState: 'user2-session.json' });
		test('verify if user received a call invite', async () => {
			await poHomeChannel.sidenav.openChat('user1');

			await expect(poHomeChannel.content.btnJoinCall.last()).toBeVisible();
		});
	});

	test('expect create video conference in a team', async () => {
		await poHomeChannel.sidenav.openChat(targetTeam);

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();
		await expect(poHomeChannel.content.btnJoinCall.last()).toBeVisible();
	});

	test.describe('video conference in a team', async () => {
		test.use({ storageState: 'user2-session.json' });
		test('verify if user received from a team', async () => {
			await poHomeChannel.sidenav.openChat(targetTeam);

			await expect(poHomeChannel.content.btnJoinCall).toBeVisible();
		});
	});
	test('expect create video conference in a multiple', async () => {
		await poHomeChannel.sidenav.openChat('rocketchat.internal.admin.test, user2');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();
		await expect(poHomeChannel.content.btnJoinCall.last()).toBeVisible();
	});

	test.describe('video conference in a multiple', async () => {
		test.use({ storageState: 'user2-session.json' });
		test('verify if user received from a multiple', async () => {
			await poHomeChannel.sidenav.openChat('rocketchat.internal.admin.test, user1');

			await expect(poHomeChannel.content.btnJoinCall).toBeVisible();
		});
	});
});
