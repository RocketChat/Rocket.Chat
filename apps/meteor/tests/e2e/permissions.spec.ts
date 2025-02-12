import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
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
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowEditing', false);
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

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowEditing', true);
		});
	});

	test.describe.serial('Delete message', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowDeleting', false);
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

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowDeleting', true);
		});
	});

	test.describe.serial('Pin message', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowPinning', false);
		});

		test('expect option(pin) not be visible', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('expect option(pin) not be visible');

			await expect(page.locator('.rcx-message', { hasText: 'expect option(pin) not be visible' })).not.toHaveAttribute('aria-busy', 'true');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionPinMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowPinning', true);
		});
	});

	// FIXME: Wrong behavior in Rocket.chat, currently it shows the button
	// and after a click a "not allowed" alert pops up
	test.describe.skip('Star message', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowStarring', false);
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

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowStarring', true);
		});
	});

	test.describe.serial('Upload file', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_Enabled', false);
		});

		test('expect option (upload file) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnOptionFileUpload).toBeDisabled();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_Enabled', true);
		});
	});

	test.describe.serial('Upload audio', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AudioRecorderEnabled', false);
		});

		test('expect option (upload audio) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnRecordAudio).toBeDisabled();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AudioRecorderEnabled', true);
		});
	});

	test.describe.serial('Upload video', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_VideoRecorderEnabled', false);
		});

		test('expect option (upload video) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnVideoMessage).toBeDisabled();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_VideoRecorderEnabled', true);
		});
	});

	test.describe.serial('Filter words', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowBadWordsFilter', true);
			await setSettingValueById(api, 'Message_BadWordsFilterList', 'badword');
		});

		test('expect badword be censored', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('badword');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('*'.repeat(7));
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_AllowBadWordsFilter', false);
		});
	});
});
