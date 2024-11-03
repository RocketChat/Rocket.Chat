import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.parallel('Mention User Card [To Room Owner]', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: [Users.user1.data.username] });

		await api.post(`/chat.postMessage`, {
			text: `Hello @${Users.user1.data.username} @${Users.user2.data.username}`,
			channel: targetChannel,
		});
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(({ api }) => deleteChannel(api, targetChannel));

	test('should show correct userinfo actions for a member of the room to the room owner', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const mentionSpan = page.locator(`span[title="Mentions user"][data-uid="${Users.user1.data.username}"]`);
		await mentionSpan.click();

		await expect(page.locator('div[aria-label="User card actions"]')).toBeVisible();
		const moreButton = await page.locator('div[aria-label="User card actions"] button[title="More"]');

		if (await moreButton.isVisible()) {
			await moreButton.click();
		}

		const isAddToRoomVisible =
			(await page.locator('button[title="Add to room"]').isVisible()) || (await page.locator('label[data-key="Add to room"]').isVisible());
		await expect(isAddToRoomVisible).toBeFalsy();

		const isRemoveFromRoomVisible =
			(await page.locator('button[title="Remove from room"]').isVisible()) ||
			(await page.locator('label[data-key="Remove from room"]').isVisible());
		await expect(isRemoveFromRoomVisible).toBeTruthy();

		const isSetAsLeaderVisible =
			(await page.locator('button[title="Set as leader"]').isVisible()) ||
			(await page.locator('label[data-key="Set as leader"]').isVisible());
		await expect(isSetAsLeaderVisible).toBeTruthy();

		const isSetAsModeratorVisible =
			(await page.locator('button[title="Set as moderator"]').isVisible()) ||
			(await page.locator('label[data-key="Set as moderator"]').isVisible());
		await expect(isSetAsModeratorVisible).toBeTruthy();
	});

	test('should show correct userinfo actions for a non-member of the room to the room owner', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const mentionSpan = page.locator(`span[title="Mentions user"][data-uid="${Users.user2.data.username}"]`);
		await mentionSpan.click();

		await expect(page.locator('div[aria-label="User card actions"]')).toBeVisible();
		const moreButton = await page.locator('div[aria-label="User card actions"] button[title="More"]');
		if (await moreButton.isVisible()) {
			await moreButton.click();
		}

		const isAddToRoomVisible =
			(await page.locator('button[title="Add to room"]').isVisible()) || (await page.locator('label[data-key="Add to room"]').isVisible());
		await expect(isAddToRoomVisible).toBeTruthy();

		const isRemoveFromRoomVisible =
			(await page.locator('button[title="Remove from room"]').isVisible()) ||
			(await page.locator('label[data-key="Remove from room"]').isVisible());
		await expect(isRemoveFromRoomVisible).toBeFalsy();

		const isSetAsLeaderVisible =
			(await page.locator('button[title="Set as leader"]').isVisible()) ||
			(await page.locator('label[data-key="Set as leader"]').isVisible());
		await expect(isSetAsLeaderVisible).toBeFalsy();

		const isSetAsModeratorVisible =
			(await page.locator('button[title="Set as moderator"]').isVisible()) ||
			(await page.locator('label[data-key="Set as moderator"]').isVisible());
		await expect(isSetAsModeratorVisible).toBeFalsy();
	});
});
