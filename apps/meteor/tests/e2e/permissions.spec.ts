import { test, expect } from './utils/test';
import { BASE_API_URL, ADMIN_CREDENTIALS } from './config/constants';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'user2-session.json' });

test.describe.serial('permissions', () => {
	let poHomeChannel: HomeChannel;
	let apiSessionHeaders: { 'X-Auth-Token': string; 'X-User-Id': string };
	let targetChannel: string;

	test.beforeAll(async ({ request }) => {
		const response = await request.post(`${BASE_API_URL}/login`, { data: ADMIN_CREDENTIALS });
		const { userId, authToken } = (await response.json()).data;

		apiSessionHeaders = { 'X-Auth-Token': authToken, 'X-User-Id': userId };
	});

	test.beforeAll(async ({ browser }) => {
		targetChannel = await createTargetChannel(browser);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('any_message');
	});

	test.describe.serial('Edit message', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(edit) not be visible', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			
			await expect(poHomeChannel.content.btnOptionEditMessage).toBeHidden();
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Delete message', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowDeleting`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(delete) not be visible', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			
			await expect(poHomeChannel.content.btnOptionDeleteMessage).toBeHidden();
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowDeleting`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Pin message', () => {
		test.use({ storageState: 'admin-session.json' });

		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(pin) not be visible', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			
			await expect(poHomeChannel.content.btnOptionPinMessage).toBeHidden();
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Star message', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowStarring`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(star) not be visible', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			
			await expect(poHomeChannel.content.btnOptionStarMessage).toBeHidden();	
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowStarring`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Upload file', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/FileUpload_Enabled`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(upload file) not be visible', async () => {
			await poHomeChannel.content.btnMenuMoreActions.click();

			await expect(poHomeChannel.content.btnOptionFileUpload).toBeHidden();	
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/FileUpload_Enabled`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Upload audio', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AudioRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(upload audio) not be visible', async () => {
			await poHomeChannel.content.btnMenuMoreActions.click();

			await expect(poHomeChannel.content.btnRecordAudio).toBeHidden();	
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AudioRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Upload video', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_VideoRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test('expect option(upload video) not be visible', async () => {
			await poHomeChannel.content.btnMenuMoreActions.click();

			await expect(poHomeChannel.content.btnVideoMessage).toBeHidden();	
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_VideoRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});

	test.describe.serial('Filter words', () => {
		test.beforeAll(async ({ request }) => {
			const response1 = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			const response2 = await request.post(`${BASE_API_URL}/settings/Message_BadWordsFilterList`, {
				headers: apiSessionHeaders,
				data: { value: 'badword' },
			});

			expect(response1.status()).toBe(200);
			expect(response2.status()).toBe(200);
		});

		test('expect badword be censored', async () => {
			await poHomeChannel.content.sendMessage('badword');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('*'.repeat(7));
		});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});
});
