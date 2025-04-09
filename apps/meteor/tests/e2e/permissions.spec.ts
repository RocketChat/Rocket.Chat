import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user2.state });

test.describe.serial('permissions', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.describe.serial('Edit message', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Message_AllowEditing', false, true);
		});

		test('expect option(edit) not be visible', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await poHomeChannel.content.sendMessage('expect option(edit) not be visible');

			await expect(page.locator('.rcx-message', { hasText: 'expect option(edit) not be visible' })).not.toHaveAttribute(
				'aria-busy',
				'true',
			);
			await poHomeChannel.content.openLastMessageMenu();
			await expect(poHomeChannel.content.btnOptionEditMessage).toBeHidden();
		});
	});

	test.describe.serial('Delete message', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Message_AllowDeleting', false, true);
		});

		test('expect option(delete) not be visible', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('expect option(delete) not be visible');

			await expect(page.locator('.rcx-message', { hasText: 'expect option(delete) not be visible' })).not.toHaveAttribute(
				'aria-busy',
				'true',
			);

			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionDeleteMessage).toBeHidden();
		});
	});

	test.describe.serial('Pin message', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Message_AllowPinning', false, true);
		});

		test('expect option(pin) not be visible', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('expect option(pin) not be visible');

			await expect(page.locator('.rcx-message', { hasText: 'expect option(pin) not be visible' })).not.toHaveAttribute('aria-busy', 'true');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionPinMessage).toBeHidden();
		});
	});

	// FIXME: Wrong behavior in Rocket.chat, currently it shows the button
	// and after a click a "not allowed" alert pops up
	test.describe.skip('Star message', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Message_AllowStarring', false, true);
		});

		test('expect option(star) not be visible', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('expect option(star) not be visible');

			await expect(page.locator('.rcx-message', { hasText: 'expect option(star) not be visible' })).not.toHaveAttribute(
				'aria-busy',
				'true',
			);
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionStarMessage).toBeHidden();
		});
	});

	test.describe.serial('Upload file', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('FileUpload_Enabled', false, true);
		});

		test('expect option (upload file) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnOptionFileUpload).toBeDisabled();
		});
	});

	test.describe.serial('Upload audio', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Message_AudioRecorderEnabled', false, true);
		});

		test('expect option (upload audio) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnRecordAudio).toBeDisabled();
		});
	});

	test.describe.serial('Upload video', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Message_VideoRecorderEnabled', false, true);
		});

		test('expect option (upload video) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnVideoMessage).toBeDisabled();
		});
	});

	test.describe.serial('Filter words', () => {
		test.beforeAll(async ({ updateSetting }) => {
			await Promise.all([
				updateSetting('Message_AllowBadWordsFilter', true, false),
				updateSetting('Message_BadWordsFilterList', 'badword', ''),
			]);
		});

		test('expect badword be censored', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('badword');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('*'.repeat(7));
		});
	});
});
