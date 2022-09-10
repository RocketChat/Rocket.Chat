import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { createTargetChannel } from './utils';
import { HomeTeam } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('teams-management', () => {
	let poHomeTeam: HomeTeam;
	let targetChannel: string;
	const targetTeam = faker.datatype.uuid();

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeTeam = new HomeTeam(page);

		await page.goto('/home');
	});

	test('expect create "targetTeam"', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.type(targetTeam);
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/group/${targetTeam}`);
	});

	test('expect throw validation error if team name already exists', async () => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.type(targetTeam);

		await expect(poHomeTeam.btnTeamCreate).toBeDisabled();
	});

	test('expect send hello in the "targetTeam" and reply in a thread', async ({ page }) => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.content.sendMessage('hello');
		await poHomeTeam.content.openLastMessageMenu();

		await page.locator('[data-qa-id="reply-in-thread"]').click();
		await page.locator('.rcx-vertical-bar .js-input-message').type('any-reply-message');
		await page.keyboard.press('Enter');

		await expect(poHomeTeam.tabs.flexTabViewThreadMessage).toHaveText('any-reply-message');
	});

	test('expect set "targetTeam" as readonly', async () => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnRoomInfo.click();
		await poHomeTeam.tabs.room.btnEdit.click();
		await poHomeTeam.tabs.room.checkboxReadOnly.click();
		await poHomeTeam.tabs.room.btnSave.click();
	});

	test('expect insert a channel inside "targetTeam"', async ({ page }) => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.btnAddExisting.click();
		await poHomeTeam.tabs.channels.inputChannels.type(targetChannel, { delay: 100 });
		await page.locator(`.rcx-option__content:has-text("${targetChannel}")`).click();
		await poHomeTeam.tabs.channels.btnAdd.click();
	});
});
