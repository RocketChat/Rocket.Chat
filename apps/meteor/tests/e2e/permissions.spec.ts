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
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowEditing', { value: false })).status();

			await expect(statusCode).toBe(200);
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
			const statusCode = (await api.post('/settings/Message_AllowEditing', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Delete message', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowDeleting', { value: false })).status();

			await expect(statusCode).toBe(200);
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
			const statusCode = (await api.post('/settings/Message_AllowDeleting', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Pin message', () => {
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowPinning', { value: false })).status();

			await expect(statusCode).toBe(200);
		});

		test('expect option(pin) not be visible', async ({ page }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('expect option(pin) not be visible');

			await expect(page.locator('.rcx-message', { hasText: 'expect option(pin) not be visible' })).not.toHaveAttribute('aria-busy', 'true');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionPinMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowPinning', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	// FIXME: Wrong behavior in Rocket.chat, currently it shows the button
	// and after a click a "not allowed" alert pops up
	test.describe.skip('Star message', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowStarring', { value: false })).status();

			await expect(statusCode).toBe(200);
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
			const statusCode = (await api.post('/settings/Message_AllowStarring', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Upload file', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/FileUpload_Enabled', { value: false })).status();

			await expect(statusCode).toBe(200);
		});

		test('expect option (upload file) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnOptionFileUpload).toBeDisabled();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/FileUpload_Enabled', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Upload audio', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AudioRecorderEnabled', { value: false })).status();

			await expect(statusCode).toBe(200);
		});

		test('expect option (upload audio) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnRecordAudio).toBeDisabled();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AudioRecorderEnabled', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Upload video', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_VideoRecorderEnabled', { value: false })).status();

			await expect(statusCode).toBe(200);
		});

		test('expect option (upload video) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.btnVideoMessage).toBeDisabled();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_VideoRecorderEnabled', { value: true })).status();

			await expect(statusCode).toBe(200);
		});
	});

	test.describe.skip('Filter words', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode1 = (await api.post('/settings/Message_AllowBadWordsFilter', { value: true })).status();
			const statusCode2 = (await api.post('/settings/Message_BadWordsFilterList', { value: 'badword' })).status();

			await expect(statusCode1).toBe(200);
			await expect(statusCode2).toBe(200);
		});

		test('expect badword be censored', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('badword');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('*'.repeat(7));
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowBadWordsFilter', { value: false })).status();

			await expect(statusCode).toBe(200);
		});
	});
});
