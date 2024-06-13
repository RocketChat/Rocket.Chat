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
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(({ api }) => deleteChannel(api, targetChannel));

	test('should show correct userinfo actions for a member of the room', async ({ page }) => {
		const { username } = Users.user1.data;
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(`Hello @${username}`);
		await page.locator('button[aria-label="Send"]').click();
		const mentionSpan = page.locator(`span[title="Mentions user"][data-uid="${username}"]`);
		await mentionSpan.click();

		await expect(page.locator('button[title="Add to room"]')).not.toBeVisible();

		await page.locator('div[aria-label="User card actions"] button[title="More"]').click();

		await expect(page.locator('label[data-key="Remove from room"]')).toBeVisible();
		await expect(page.locator('label[data-key="Set as leader"]')).toBeVisible();
		await expect(page.locator('label[data-key="Set as moderator"]')).toBeVisible();
	});

	test('should show correct userinfo actions for a non-member of the room', async ({ page }) => {
		const { username } = Users.user2.data;
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(`Hello @${username}`);
		await page.locator('button[aria-label="Send"]').click();
		const mentionSpan = page.locator(`span[title="Mentions user"][data-uid="${username}"]`);
		await mentionSpan.click();

		await expect(page.locator('button[title="Add to room"]')).toBeVisible();

		await page.locator('div[aria-label="User card actions"] button[title="More"]').click();

		await expect(page.locator('label[data-key="Remove from room"]')).not.toBeVisible();
		await expect(page.locator('label[data-key="Set as leader"]')).not.toBeVisible();
		await expect(page.locator('label[data-key="Set as moderator"]')).not.toBeVisible();
	});
});
