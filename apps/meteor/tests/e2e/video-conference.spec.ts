import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import {
	createArchivedChannel,
	createTargetChannel,
	setUserPreferences,
	createTargetTeam,
	createDirectMessage,
	deleteChannel,
	deleteTeam,
} from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetReadOnlyChannel: string;
	let targetArchivedChannel: string;
	let targetTeam: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetReadOnlyChannel = await createTargetChannel(api, { readOnly: true });
		targetArchivedChannel = await createArchivedChannel(api);
		targetTeam = await createTargetTeam(api);
		await createDirectMessage(api);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteChannel(api, targetChannel),
			deleteChannel(api, targetArchivedChannel),
			deleteChannel(api, targetReadOnlyChannel),
			deleteTeam(api, targetTeam),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should create video conference in targetChannel using keyboard', async ({ page }) => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello video conference');
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await test.step('opens video conference popup', async () => {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Space');

			await expect(poHomeChannel.content.getVideoConfPopup(`Start a call in ${targetChannel}`)).toBeVisible();
			await expect(poHomeChannel.content.btnVideoConfMic).toBeFocused();
		});

		await test.step('dispatch start call button', async () => {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Space');
		});

		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('video conference message block', async () => {
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, { displayAvatars: false });
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, { displayAvatars: true });
		});

		test('should NOT render avatars in video conference message block', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);

			await expect(poHomeChannel.content.videoConfMessageBlock.last().getByRole('figure')).toHaveCount(0);
		});
	});

	test.describe('verify if user2 received a invite call in targetChannel', async () => {
		test.use({ storageState: Users.user2.state });
		test('should display a message block in a targetChannel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should create video conference in a direct room', async () => {
		await poHomeChannel.navbar.openChat('user2');

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if user received from a direct', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received a call invite in direct', async () => {
			await poHomeChannel.navbar.openChat('user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should create video conference in targetTeam', async () => {
		await poHomeChannel.navbar.openChat(targetTeam);

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if user2 received from a targetTeam', async () => {
		test.use({ storageState: Users.user2.state });
		test('should display a message block in a targetTeam', async () => {
			await poHomeChannel.navbar.openChat(targetTeam);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should create video conference in a direct multiple', async () => {
		await poHomeChannel.navbar.openChat('rocketchat.internal.admin.test, user2');

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('received in a direct multiple', async () => {
		test.use({ storageState: Users.user2.state });
		test('should display a message block in a direct multiple', async () => {
			await poHomeChannel.navbar.openChat('rocketchat.internal.admin.test, user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should NOT create video conference in a targetReadOnlyChannel', async () => {
		await poHomeChannel.navbar.openChat(targetReadOnlyChannel);

		await expect(poHomeChannel.content.btnVideoCall).toBeDisabled();
	});

	test('should NOT be able to create video conference in targetArchivedChannel', async () => {
		await poHomeChannel.navbar.openChat(targetArchivedChannel);

		await expect(poHomeChannel.content.btnVideoCall).toBeDisabled();
	});
});
