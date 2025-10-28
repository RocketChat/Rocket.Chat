import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('message-composer', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should have all formatters and the main actions visible on toolbar', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await expect(poHomeChannel.composerToolbarActions).toHaveCount(12);
	});

	test('should have only the main formatter and the main action', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 600 });
		await poHomeChannel.sidenav.openChat(targetChannel);

		await expect(poHomeChannel.composerToolbarActions).toHaveCount(6);
	});

	test('should navigate on toolbar using arrow keys', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(poHomeChannel.composerToolbar.getByRole('button', { name: 'Italic' })).toBeFocused();

		await page.keyboard.press('ArrowLeft');
		await expect(poHomeChannel.composerToolbar.getByRole('button', { name: 'Bold' })).toBeFocused();
	});

	test('should move the focus away from toolbar using tab key', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		await expect(poHomeChannel.composerToolbar.getByRole('button', { name: 'Emoji' })).not.toBeFocused();
	});

	test('should add a link to the selected text', async ({ page }) => {
		const url = faker.internet.url();
		await poHomeChannel.sidenav.openChat(targetChannel);

		await page.keyboard.type('hello composer');
		await page.keyboard.press('Control+A'); // on Windows and Linux
		await page.keyboard.press('Meta+A'); // on macOS
		await poHomeChannel.composerToolbar.getByRole('button', { name: 'Link' }).click();
		await page.keyboard.type(url);
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.composer).toHaveValue(`[hello composer](${url})`);
	});

	test('should select popup item and not send the message when pressing enter', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await test.step('mention popup', async () => {
			await page.keyboard.type('hello composer @all');

			await page.keyboard.press('Enter');

			await expect(poHomeChannel.composer).toHaveValue('hello composer @all ');

			await poHomeChannel.composer.fill('');
		});

		await test.step('emoji popup', async () => {
			await page.keyboard.type('hello composer :flag_br');

			await page.keyboard.press('Enter');

			await expect(poHomeChannel.composer).toHaveValue('hello composer :flag_br: ');

			await poHomeChannel.composer.fill('');
		});

		await test.step('slash command', async () => {
			await page.keyboard.type('/gim');

			await page.keyboard.press('Enter');

			await expect(poHomeChannel.composer).toHaveValue('/gimme ');

			await poHomeChannel.composer.fill('');
		});
	});

	test('should list popup items correctly', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await test.step('mention popup', async () => {
			await page.keyboard.type('hello composer @rocket.cat');

			await expect(poHomeChannel.composerBoxPopup.getByText('rocket.cat')).toBeVisible();
		});
	});

	test.describe('audio recorder', () => {
		test('should open audio recorder', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.composerToolbar.getByRole('button', { name: 'Audio message', exact: true }).click();

			await expect(poHomeChannel.audioRecorder).toBeVisible();
		});

		test('should stop recording when clicking on cancel', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.composerToolbar.getByRole('button', { name: 'Audio message', exact: true }).click();
			await expect(poHomeChannel.audioRecorder).toBeVisible();

			await poHomeChannel.audioRecorder.getByRole('button', { name: 'Cancel recording', exact: true }).click();
			await expect(poHomeChannel.audioRecorder).not.toBeVisible();
		});

		test('should open file modal when clicking on "Finish recording"', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.composerToolbar.getByRole('button', { name: 'Audio message', exact: true }).click();
			await expect(poHomeChannel.audioRecorder).toBeVisible();

			await page.waitForTimeout(1000);
			await poHomeChannel.audioRecorder.getByRole('button', { name: 'Finish Recording', exact: true }).click();
			await expect(poHomeChannel.content.fileUploadModal).toBeVisible();
		});
	});
});
