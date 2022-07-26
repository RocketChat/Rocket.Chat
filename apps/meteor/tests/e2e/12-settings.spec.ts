import { test, expect, Page } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { BASE_API_URL } from './utils/constants';
import { adminLogin, validUserInserted, registerUser } from './utils/mocks/userAndPasswordMock';
import { Auth, HomeChannel, AccountProfile, Administration } from './page-objects';

const apiSessionHeaders = { 'X-Auth-Token': '', 'X-User-Id': '' };

test.describe.skip('Settings', async () => {
	let page: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;
	let pageAccountProfile: AccountProfile;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
		pageAccountProfile = new AccountProfile(page);

		await pageAuth.doLogin(validUserInserted);
		await pageHomeChannel.sidenav.doOpenChat('general');
	});

	test.beforeAll(async ({ request }) => {
		const response = await request.post(`${BASE_API_URL}/login`, { data: adminLogin });
		const { userId, authToken } = (await response.json()).data;

		apiSessionHeaders['X-Auth-Token'] = authToken;
		apiSessionHeaders['X-User-Id'] = userId;
	});

	test('(API) expect successfully create a session', async () => {
		expect(apiSessionHeaders['X-Auth-Token'].length).toBeGreaterThan(0);
		expect(apiSessionHeaders['X-User-Id'].length).toBeGreaterThan(0);
	});

	test.describe.serial('Message edit', () => {
		test('(API) expect disable message editing', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(edit) not be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="edit-message"]')).toBeFalsy();
		});

		test('(API) expect enable message editing', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowEditing`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(edit) be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="edit-message"]')).toBeTruthy();
		});
	});

	test.describe.serial('Message delete', () => {
		test('(API) expect disable message deleting', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowDeleting`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(delete) not be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="delete-message"]')).toBeFalsy();
		});

		test('(API) expect enable message deleting', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowDeleting`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(delete) be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="delete-message"]')).toBeTruthy();
		});
	});

	test.describe.serial('Audio files', () => {
		test('(API) expect disable audio files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AudioRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(upload audio) not be visible', async () => {
			await pageHomeChannel.content.doReload();

			expect(await pageHomeChannel.content.btnAudioRecod.isVisible()).toBeFalsy();
		});

		test('(API) expect enable audio files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AudioRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(upload audio) be visible', async () => {
			await pageHomeChannel.content.doReload();

			expect(await pageHomeChannel.content.btnAudioRecod.isVisible()).toBeTruthy();
		});
	});

	test.describe.serial('Video files', () => {
		test('(API) expect disable video files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_VideoRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(upload video) not be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.openMoreActionMenu();

			expect(await page.isVisible('.rc-popover__content [data-id="video-message"]')).toBeFalsy();
		});

		test('(API) expect enable video files', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_VideoRecorderEnabled`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(upload video) be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.openMoreActionMenu();

			expect(await page.isVisible('.rc-popover__content [data-id="video-message"]')).toBeTruthy();
		});
	});

	test.describe.serial('Bad words filter', () => {
		const unauthorizedWord = 'badword';

		test('(API) expect add "badword" to filterlist', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_BadWordsFilterList`, {
				headers: apiSessionHeaders,
				data: { value: unauthorizedWord },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(API) expect enable bad words filter', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect badword be censored', async () => {
			await pageHomeChannel.content.doReload();

			await pageHomeChannel.content.doSendMessage(unauthorizedWord);
			await expect(pageHomeChannel.content.lastMessage).toContainText('*'.repeat(unauthorizedWord.length));
		});

		test('(API) expect disable bad words filter', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowBadWordsFilter`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect badword not be censored', async () => {
			await pageHomeChannel.content.doReload();

			await pageHomeChannel.content.doSendMessage(unauthorizedWord);
			await expect(pageHomeChannel.content.lastMessage).toContainText(unauthorizedWord);
		});
	});

	test.describe.serial('Message star', () => {
		test('(API) expect disable message starring', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowStarring`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test.skip('(UI) expect option(star message) not be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="star-message"]')).toBeFalsy();
		});

		test('(API) expect enable message starring', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowStarring`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(star message) be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="star-message"]')).toBeTruthy();
		});
	});

	test.describe.serial('File upload', () => {
		test('(API) expect disable file upload', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/FileUpload_Enabled`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(upload file) not be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.openMoreActionMenu();

			expect(await page.isVisible('[data-qa-id="file-upload"]')).toBeFalsy();
		});

		test('(API) expect enable file upload', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/FileUpload_Enabled`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(upload file) be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.openMoreActionMenu();

			expect(await page.isVisible('[data-qa-id="file-upload"]')).toBeTruthy();
		});
	});

	test.describe.serial('Profile change', () => {
		test('(API) expect disable profile change', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Accounts_AllowUserProfileChange`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test.skip('(UI) expect options(update profile) be disabled', async () => {
			await pageHomeChannel.sidenav.btnAvatar.click();
			await pageHomeChannel.sidenav.linkAccount.click();

			expect(pageAccountProfile.avatarFileInput.isDisabled()).toBeTruthy();
			expect(pageAccountProfile.emailTextInput.isDisabled()).toBeTruthy();
			expect(pageAccountProfile.inputName.isDisabled()).toBeTruthy();
			expect(pageAccountProfile.inputUsername.isDisabled()).toBeTruthy();
		});

		test('(API) expect enable profile change', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Accounts_AllowUserProfileChange`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});

	test.describe('Avatar change', () => {
		test('(API) expect disable avatar change', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Accounts_AllowUserAvatarChange`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test.skip('(UI) expect option(update avatar) be disabled', async () => {
			await pageHomeChannel.sidenav.btnAvatar.click();
			await pageHomeChannel.sidenav.linkAccount.click();

			expect(pageAccountProfile.avatarFileInput.isDisabled()).toBeTruthy();
		});

		test('(API) expect enable avatar change', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Accounts_AllowUserAvatarChange`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});
});

test.describe.skip('Settings (admin)', async () => {
	let page: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;
	let pageAdmin: Administration;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
		pageAdmin = new Administration(page);

		await page.goto('/');
		await pageAuth.doLogin();
		await pageHomeChannel.sidenav.doOpenChat('general');
	});

	test.beforeAll(async ({ request }) => {
		const response = await request.post(`${BASE_API_URL}/login`, { data: adminLogin });
		const { userId, authToken } = (await response.json()).data;

		apiSessionHeaders['X-Auth-Token'] = authToken;
		apiSessionHeaders['X-User-Id'] = userId;
	});

	test.describe.serial('Message pin', () => {
		test('(API) expect disable message pinning', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(pin message) not be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="pin-message"]')).toBeFalsy();
		});

		test('(API) expect enable message pinning', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Message_AllowPinning`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test('(UI) expect option(pin message) be visible', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="pin-message"]')).toBeTruthy();
		});
	});

	test.describe.serial('Manual new users approve', () => {
		test('(API) expect enable manually approve new users', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Accounts_ManuallyApproveNewUsers`, {
				headers: apiSessionHeaders,
				data: { value: true },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});

		test.describe('(UI) expect activate/deactivate flow as admin', () => {
			test('expect open /users as admin', async () => {
				await page.goto('/admin');
				await pageAdmin.usersLink.click();
			});

			test('expect find registered user', async () => {
				await pageAdmin.usersFilter.type(registerUser.email, { delay: 200 });
				await pageAdmin.userInTable(registerUser.email).click();
			});

			test('expect activate registered user', async () => {
				await pageAdmin.userInfoActions.locator('button:nth-child(3)').click();
				await page.locator('value="changeActiveStatus"]').click();
			});

			test('expect deactivate registered user', async () => {
				await pageAdmin.userInfoActions.locator('button:nth-child(3)').click();
				await page.locator('value="changeActiveStatus"]').click();
			});
		});

		test('(API) expect disable manually approve new users', async ({ request }) => {
			const response = await request.post(`${BASE_API_URL}/settings/Accounts_ManuallyApproveNewUsers`, {
				headers: apiSessionHeaders,
				data: { value: false },
			});
			const data = await response.json();

			expect(response.status()).toBe(200);
			expect(data).toHaveProperty('success', true);
		});
	});
});
