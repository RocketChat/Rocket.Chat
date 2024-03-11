import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeTeam } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('teams-management', () => {
	let poHomeTeam: HomeTeam;
	let targetChannel: string;
	const targetTeam = faker.string.uuid();
	const targetTeamNonPrivate = faker.string.uuid();
	const targetTeamReadOnly = faker.string.uuid();

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeTeam = new HomeTeam(page);

		await page.goto('/home');
	});

	test('expect create "targetTeam" private', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.type(targetTeam);
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/group/${targetTeam}`);
	});

	test('expect create "targetTeamNonPrivate" non private', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.type(targetTeamNonPrivate);
		await poHomeTeam.textPrivate.click();
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/channel/${targetTeamNonPrivate}`);
	});

	test('expect create "targetTeamReadOnly" readonly', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.type(targetTeamReadOnly);
		await poHomeTeam.textReadOnly.click();
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/group/${targetTeamReadOnly}`);
	});

	test('expect throw validation error if team name already exists', async () => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.type(targetTeam);
		await poHomeTeam.btnTeamCreate.click();

		await expect(poHomeTeam.inputTeamName).toHaveAttribute('aria-invalid', 'true');
	});

	test('expect send hello in the "targetTeam" and reply in a thread', async ({ page }) => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.content.sendMessage('hello');
		await page.locator('[data-qa-type="message"]').last().hover();

		await page.locator('role=button[name="Reply in thread"]').click();
		await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetTeam}"]`).type('any-reply-message');
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
		await expect(page.locator('//main//aside >> li')).toContainText(targetChannel);
	});

	test('should access team channel through "targetTeam" header', async ({ page }) => {
		await poHomeTeam.sidenav.openChat(targetChannel);
		await page.getByRole('button', { name: targetChannel }).first().focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Space');

		await expect(page).toHaveURL(`/group/${targetTeam}`);
	});
});
