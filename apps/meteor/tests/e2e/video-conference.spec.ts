import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetTeam, createDirectMessage } from './utils';
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

	test('expect create video conference in a "targetChannel"', async () => {
		await poHomeChannel.sidebar.openChat(targetChannel);

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('test received in a "target channel"', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received a invite call from "targetChannel"', async () => {
			await poHomeChannel.sidebar.openChat(targetChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference in a direct', async () => {
		await poHomeChannel.sidebar.openChat('user2');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if user received from a direct', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received a call invite in direct', async () => {
			await poHomeChannel.sidebar.openChat('user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference in a "targetTeam"', async () => {
		await poHomeChannel.sidebar.openChat(targetTeam);

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if received from a "targetTeam"', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received from a "targetTeam"', async () => {
			await poHomeChannel.sidebar.openChat(targetTeam);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference in a direct multiple', async () => {
		await poHomeChannel.sidebar.openChat('rocketchat.internal.admin.test, user2');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('received in a direct multiple', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received from a multiple', async () => {
			await poHomeChannel.sidebar.openChat('rocketchat.internal.admin.test, user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('expect create video conference not available in a "targetReadOnlyChannel"', async () => {
		await poHomeChannel.sidebar.openChat(targetReadOnlyChannel);

		await expect(poHomeChannel.content.btnCall).hasAttribute('disabled');
	});
});
