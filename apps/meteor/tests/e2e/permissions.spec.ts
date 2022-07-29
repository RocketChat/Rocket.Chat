import { test, expect } from '@playwright/test';

import { BASE_API_URL, ADMIN_CREDENTIALS } from './config/constants';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'session.json' });

test.describe.parallel('permissions', () => {
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
	});

	test.describe.serial('Edit message', () => {
		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test.fixme('expect option(edit) not be visible', async () => {
			await poHomeChannel.content.sendMessage('any_message');
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

		test.fixme('expect option(delete) not be visible', async () => {
			await poHomeChannel.content.sendMessage('any_message');
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
		test.use({ storageState: 'session-admin.json' });

		test.beforeAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});

			expect(response.status()).toBe(200);
		});

		test.fixme('expect option(pin) not be visible', async () => {
			await poHomeChannel.content.sendMessage('any_message');
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

		test.fixme('expect option(star) not be visible', async () => {
			await poHomeChannel.content.sendMessage('any_message');
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

		test.fixme('expect option(upload file) not be visible', async () => {});

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

		test.fixme('expect option(upload audio) not be visible', async () => {});

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

		test.fixme('expect option(upload video) not be visible', async () => {});

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

		test.fixme('expect badword be censored', async () => {});

		test.afterAll(async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});

			expect(response.status()).toBe(200);
		});
	});
});
