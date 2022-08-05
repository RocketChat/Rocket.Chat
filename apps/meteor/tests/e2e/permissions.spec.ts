import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'user2-session.json' });

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

			expect(statusCode).toBe(200);
		});

		test('expect option(edit) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('any_message');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionEditMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowEditing', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Delete message', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowDeleting', { value: false })).status();

			expect(statusCode).toBe(200);
		});

		test('expect option(delete) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('any_message');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionDeleteMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowDeleting', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Pin message', () => {
		test.use({ storageState: 'admin-session.json' });

		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowPinning', { value: false })).status();

			expect(statusCode).toBe(200);
		});

		test('expect option(pin) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('any_message');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionPinMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowPinning', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	// FIXME: Wrong behavior in Rocket.chat, currently it shows the button
	// and after a click a "not allowed" alert pops up
	test.describe.skip('Star message', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowStarring', { value: false })).status();

			expect(statusCode).toBe(200);
		});

		test('expect option(star) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('any_message');
			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionStarMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowStarring', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Upload file', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/FileUpload_Enabled', { value: false })).status();

			expect(statusCode).toBe(200);
		});

		test('expect option(upload file) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.btnMenuMoreActions.click();

			await expect(poHomeChannel.content.btnOptionFileUpload).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/FileUpload_Enabled', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Upload audio', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AudioRecorderEnabled', { value: false })).status();

			expect(statusCode).toBe(200);
		});

		test('expect option(upload audio) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.btnMenuMoreActions.click();

			await expect(poHomeChannel.content.btnRecordAudio).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AudioRecorderEnabled', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	test.describe.serial('Upload video', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_VideoRecorderEnabled', { value: false })).status();

			expect(statusCode).toBe(200);
		});

		test('expect option(upload video) not be visible', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.btnMenuMoreActions.click();

			await expect(poHomeChannel.content.btnVideoMessage).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_VideoRecorderEnabled', { value: true })).status();

			expect(statusCode).toBe(200);
		});
	});

	test.describe.skip('Filter words', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode1 = (await api.post('/settings/Message_AllowBadWordsFilter', { value: true })).status();
			const statusCode2 = (await api.post('/settings/Message_BadWordsFilterList', { value: 'badword' })).status();

			expect(statusCode1).toBe(200);
			expect(statusCode2).toBe(200);
		});

		test('expect badword be censored', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('badword');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('*'.repeat(7));
		});

		test.afterAll(async ({ api }) => {
			const statusCode = (await api.post('/settings/Message_AllowBadWordsFilter', { value: false })).status();

			expect(statusCode).toBe(200);
		});
	});
});
