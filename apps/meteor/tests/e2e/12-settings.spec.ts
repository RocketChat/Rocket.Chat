import { test, expect } from '@playwright/test';

import { BASE_API_URL } from './utils/mocks/urlMock';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

const headersSession = {
	'X-Auth-Token': '',
	'X-User-Id': '',
};

test.describe('[API Settings Change]', async () => {
	test.beforeAll(async ({ request }) => {
		const response = await request.post(`${BASE_API_URL}/login`, { data: adminLogin });
		const { userId, authToken } = (await response.json()).data;

		headersSession['X-Auth-Token'] = authToken;
		headersSession['X-User-Id'] = userId;
	});

	test('expect successfully create a session', async () => {
		expect(headersSession['X-Auth-Token'].length).toBeGreaterThan(0);
		expect(headersSession['X-User-Id'].length).toBeGreaterThan(0);
	});

	test.describe('Message edit:', () => {
		test('(API) expect disable message editing', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable message editing', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});

	test.describe('Message delete:', () => {
		test('(API) expect disable message deleting', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowDeleting`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable message deleting', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowDeleting`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});

	test.describe('Audio files:', () => {
		test('(API) expect disable audio files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AudioRecorderEnabled`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable audio files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AudioRecorderEnabled`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});

	test.describe('Video files:', () => {
		test('(API) expect disable video files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_VideoRecorderEnabled`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable video files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_VideoRecorderEnabled`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});

	test.describe('Bad words filter:', () => {
		test('(API) expect enable bad words filter', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect add "badword" to filterlist', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_BadWordsFilterList`, {
				headers: headersSession,
				data: { value: 'badword' },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect disable bad words filter', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	})

	test.describe('Message pin:', () => {
		test('(API) expect disable message pinning', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable message pinning', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	})

	test.describe('Message star:', () => {
		test('(API) expect disable message starring', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowStarring`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable message starring', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowStarring`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	})

	test.describe('File upload:', () => {
		test('(API) expect disable file upload', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/FileUpload_Enabled`, {
				headers: headersSession,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable file upload', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/FileUpload_Enabled`, {
				headers: headersSession,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	})
});
