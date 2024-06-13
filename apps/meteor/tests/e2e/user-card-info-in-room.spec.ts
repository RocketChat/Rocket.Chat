import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.parallel('Mention User Card', () => {
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

	test('should show correct userinfo actions for a member of the room', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const mentionSpan = page.locator(`span[title="Mentions user"][data-uid="${Users.user1.data.username}"]`);
		await mentionSpan.click();

		await expect(page.locator('button[title="Add to room"]')).not.toBeVisible();

		await page.locator('div[aria-label="User card actions"] button[title="More"]').click();

		await expect(page.locator('label[data-key="Remove from room"]')).toBeVisible();
		await expect(page.locator('label[data-key="Set as leader"]')).toBeVisible();
		await expect(page.locator('label[data-key="Set as moderator"]')).toBeVisible();
	});

	test('should show correct userinfo actions for a non-member of the room', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const mentionSpan = page.locator(`span[title="Mentions user"][data-uid="${Users.user2.data.username}"]`);
		await mentionSpan.click();

		await expect(page.locator('button[title="Add to room"]')).toBeVisible();

		await page.locator('div[aria-label="User card actions"] button[title="More"]').click();

		await expect(page.locator('label[data-key="Remove from room"]')).not.toBeVisible();
		await expect(page.locator('label[data-key="Set as leader"]')).not.toBeVisible();
		await expect(page.locator('label[data-key="Set as moderator"]')).not.toBeVisible();
	});
});
