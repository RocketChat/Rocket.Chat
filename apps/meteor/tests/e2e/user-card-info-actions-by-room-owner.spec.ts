import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test } from './utils/test';

// Actions may render as fixed buttons or inside the "More" kebab menu,
// depending on how many fit — collect both before asserting.
const getAvailableUserCardActions = async (page: Page): Promise<string[]> => {
	const userCard = page.getByRole('dialog', { name: 'User card' });
	const toolbar = userCard.getByRole('toolbar', { name: 'User card actions' });
	await expect(toolbar).toBeVisible();

	const actions = await toolbar.getByRole('button').allInnerTexts();

	const moreButton = toolbar.getByRole('button', { name: 'More' });
	if (await moreButton.isVisible()) {
		await moreButton.click();
		const menu = page.getByRole('menu', { name: 'More' });
		await expect(menu).toBeVisible();
		actions.push(...(await menu.getByRole('menuitem').allInnerTexts()));
		await page.keyboard.press('Escape');
	}

	return actions.map((action) => action.trim()).filter(Boolean);
};

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
		await poHomeChannel.navbar.openChat(targetChannel);
		await page.locator(`span[title="Mentions user"][data-uid="${Users.user1.data.username}"]`).click();

		const actions = await getAvailableUserCardActions(page);

		expect(actions).not.toContain('Add to room');
		expect(actions).toContain('Remove from room');
		expect(actions).toContain('Set as leader');
		expect(actions).toContain('Set as moderator');
	});

	test('should show correct userinfo actions for a non-member of the room to the room owner', async ({ page }) => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await page.locator(`span[title="Mentions user"][data-uid="${Users.user2.data.username}"]`).click();

		const actions = await getAvailableUserCardActions(page);

		expect(actions).toContain('Add to room');
		expect(actions).not.toContain('Remove from room');
		expect(actions).not.toContain('Set as leader');
		expect(actions).not.toContain('Set as moderator');
	});
});
