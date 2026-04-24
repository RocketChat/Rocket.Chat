import { faker } from '@faker-js/faker';
import type { BrowserContext, Page } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

test.use({ storageState: Users.user1.state });

test.describe.serial('message-composer', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let page: Page;
	let context: BrowserContext;

	test.beforeAll(async ({ api, browser }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		context = await browser.newContext({ storageState: Users.user1.state, viewport: DEFAULT_VIEWPORT });
		page = await context.newPage();
		poHomeChannel = new HomeChannel(page);
	});

	test.afterAll(async () => {
		await page.close();
		await context.close();
	});

	test.beforeEach(async () => {
		// One test shrinks the viewport to 768x600 — make sure we start at the
		// default each time.
		await page.setViewportSize(DEFAULT_VIEWPORT);
		await page.goto('/home');
	});

	test('should have all formatters and the main actions visible on toolbar', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await expect(poHomeChannel.composer.allPrimaryActions).toHaveCount(12);
	});

	test('should have only the main formatter and the main action', async () => {
		await page.setViewportSize({ width: 768, height: 600 });
		await poHomeChannel.navbar.openChat(targetChannel);

		await expect(poHomeChannel.composer.allPrimaryActions).toHaveCount(6);
	});

	test('should navigate on toolbar using arrow keys', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);

		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(poHomeChannel.composer.btnItalicFormatter).toBeFocused();

		await page.keyboard.press('ArrowLeft');
		await expect(poHomeChannel.composer.btnBoldFormatter).toBeFocused();
	});

	test('should move the focus away from toolbar using tab key', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);

		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		await expect(poHomeChannel.composer.btnEmoji).not.toBeFocused();
	});

	test('should add a link to the selected text', async () => {
		const url = faker.internet.url();
		await poHomeChannel.navbar.openChat(targetChannel);

		await page.keyboard.type('hello composer');
		await page.keyboard.press('Control+A'); // on Windows and Linux
		await page.keyboard.press('Meta+A'); // on macOS
		await poHomeChannel.composer.btnLinkFormatter.click();
		await page.keyboard.type(url);
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.composer.inputMessage).toHaveValue(`[hello composer](${url})`);
	});

	test('should select popup item and not send the message when pressing enter', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await test.step('mention popup', async () => {
			await page.keyboard.type('hello composer @all');

			await page.keyboard.press('Enter');

			await expect(poHomeChannel.composer.inputMessage).toHaveValue('hello composer @all ');

			await poHomeChannel.composer.inputMessage.fill('');
		});

		await test.step('emoji popup', async () => {
			await page.keyboard.type('hello composer :flag_br');

			await page.keyboard.press('Enter');

			await expect(poHomeChannel.composer.inputMessage).toHaveValue('hello composer :flag_br: ');

			await poHomeChannel.composer.inputMessage.fill('');
		});

		await test.step('slash command', async () => {
			await page.keyboard.type('/gim');

			await page.keyboard.press('Enter');

			await expect(poHomeChannel.composer.inputMessage).toHaveValue('/gimme ');

			await poHomeChannel.composer.inputMessage.fill('');
		});
	});

	test('should list popup items correctly', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await test.step('mention popup', async () => {
			await page.keyboard.type('hello composer @rocket.cat');

			await expect(poHomeChannel.composer.boxPopup.getByText('rocket.cat')).toBeVisible();
		});
	});

	test('should close mention popup when canceling a message edit via "Cancel" button', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await test.step('expect to edit last message', async () => {
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('');
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionEditMessage.click();
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('hello composer');
		});

		await test.step('expect to open popup on mention', async () => {
			await page.keyboard.type(' @');
			await expect(poHomeChannel.composer.boxPopup).toBeVisible();
		});

		await test.step('expect popup to close after the first edit is cancelled', async () => {
			await poHomeChannel.composer.btnCancel.click();
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('hello composer');
			await expect(poHomeChannel.composer.boxPopup).not.toBeVisible();
		});

		await test.step('expect to leave editing mode', async () => {
			await poHomeChannel.composer.btnCancel.click();
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('');
		});
	});

	test('should close mention popup when canceling a message edit via keyboard', async () => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');

		await test.step('expect to edit last message', async () => {
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('');
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionEditMessage.click();
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('hello composer');
		});

		await test.step('expect to open popup on mention', async () => {
			await page.keyboard.type(' @');
			await expect(poHomeChannel.composer.boxPopup).toBeVisible();
		});

		await test.step('expect popup to close after the first edit is cancelled', async () => {
			await page.keyboard.press('Escape');
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('hello composer');
			await expect(poHomeChannel.composer.boxPopup).not.toBeVisible();
		});

		await test.step('expect to leave editing mode', async () => {
			await page.keyboard.press('Escape');
			await expect(poHomeChannel.composer.inputMessage).toHaveValue('');
		});
	});

	test.describe('audio recorder', () => {
		test('should open audio recorder', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.composer.btnAudioMessage.click();

			await expect(poHomeChannel.audioRecorder).toBeVisible();
		});

		test('should stop recording when clicking on cancel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.composer.btnAudioMessage.click();
			await expect(poHomeChannel.audioRecorder).toBeVisible();

			await poHomeChannel.audioRecorder.getByRole('button', { name: 'Cancel recording', exact: true }).click();
			await expect(poHomeChannel.audioRecorder).not.toBeVisible();
		});

		test('should attach file to the composer when clicking on "Finish recording"', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.composer.btnAudioMessage.click();
			await expect(poHomeChannel.audioRecorder).toBeVisible();

			await page.waitForTimeout(1000);
			await poHomeChannel.audioRecorder.getByRole('button', { name: 'Finish Recording', exact: true }).click();
			await expect(poHomeChannel.composer.getFileByName('Audio record.mp3')).toBeVisible();
		});
	});
});
