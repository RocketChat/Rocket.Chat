import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setUserPreferences, createTargetTeam, createDirectMessage } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetReadOnlyChannel: string;
	let targetTeam: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetReadOnlyChannel = await createTargetChannel(api, { readOnly: true });
		targetTeam = await createTargetTeam(api);
		await createDirectMessage(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should create video conference in targetChannel using keyboard', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello video conference');
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await test.step('opens video conference popup', async () => {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Space');

			await expect(poHomeChannel.content.btnVideoConfMic).toBeFocused();
		});

		await test.step('dispatch start call button', async () => {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Space');
		});

		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('test video conference message block', async () => {
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, { displayAvatars: false });
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, { displayAvatars: true });
		});

		test('should not render avatars in video conference message block', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await expect(poHomeChannel.content.videoConfMessageBlock.last().getByRole('figure')).toHaveCount(0);
		});
	});

	test.describe('test received in a "target channel"', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received a invite call from "targetChannel"', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference in a direct', async () => {
		await poHomeChannel.sidenav.openChat('user2');

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if user received from a direct', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received a call invite in direct', async () => {
			await poHomeChannel.sidenav.openChat('user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference in a "targetTeam"', async () => {
		await poHomeChannel.sidenav.openChat(targetTeam);

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if received from a "targetTeam"', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received from a "targetTeam"', async () => {
			await poHomeChannel.sidenav.openChat(targetTeam);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference in a direct multiple', async () => {
		await poHomeChannel.sidenav.openChat('rocketchat.internal.admin.test, user2');

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('received in a direct multiple', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received from a multiple', async () => {
			await poHomeChannel.sidenav.openChat('rocketchat.internal.admin.test, user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference not available in a "targetReadOnlyChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetReadOnlyChannel);

		await expect(poHomeChannel.content.btnVideoCall).hasAttribute('disabled');
	});
});
