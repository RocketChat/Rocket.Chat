import { test, expect, Page } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { BASE_API_URL } from './utils/mocks/urlMock';
import { adminLogin, validUserInserted, registerUser } from './utils/mocks/userAndPasswordMock';
import LoginPage from './utils/pageobjects/LoginPage';
import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import Administration from './utils/pageobjects/Administration';
import PreferencesMainContent from './utils/pageobjects/PreferencesMainContent';

const apiSessionHeaders = { 'X-Auth-Token': '', 'X-User-Id': '' };

test.describe.skip('[Settings]', async () => {
	let page: Page;
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let userPreferences: PreferencesMainContent;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		page = await context.newPage();

		loginPage = new LoginPage(page);
		mainContent = new MainContent(page);
		sideNav = new SideNav(page);
		userPreferences = new PreferencesMainContent(page);

		await loginPage.goto('/');
		await loginPage.login(validUserInserted);
		await sideNav.general().click();
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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();

			expect(await mainContent.recordBtn().isVisible()).toBeFalsy();
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
			await mainContent.doReload();

			expect(await mainContent.recordBtn().isVisible()).toBeTruthy();
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
			await mainContent.doReload();
			await mainContent.openMoreActionMenu();

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
			await mainContent.doReload();
			await mainContent.openMoreActionMenu();

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
			await mainContent.doReload();

			await mainContent.sendMessage(unauthorizedWord);
			await mainContent.waitForLastMessageEqualsText('*'.repeat(unauthorizedWord.length));
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
			await mainContent.doReload();

			await mainContent.sendMessage(unauthorizedWord);
			await mainContent.waitForLastMessageEqualsText(unauthorizedWord);
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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();
			await mainContent.openMoreActionMenu();

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
			await mainContent.doReload();
			await mainContent.openMoreActionMenu();

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
			await sideNav.sidebarUserMenu().click();
			await sideNav.account().click();

			expect(userPreferences.avatarFileInput().isDisabled()).toBeTruthy();
			expect(userPreferences.emailTextInput().isDisabled()).toBeTruthy();
			expect(userPreferences.realNameTextInput().isDisabled()).toBeTruthy();
			expect(userPreferences.userNameTextInput().isDisabled()).toBeTruthy();
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
			await sideNav.sidebarUserMenu().click();
			await sideNav.account().click();

			expect(userPreferences.avatarFileInput().isDisabled()).toBeTruthy();
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

test.describe.skip('[Settings (admin)]', async () => {
	let page: Page;
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let admin: Administration;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		page = await context.newPage();

		loginPage = new LoginPage(page);
		mainContent = new MainContent(page);
		sideNav = new SideNav(page);
		admin = new Administration(page);

		await loginPage.goto('/');
		await loginPage.login(adminLogin);
		await sideNav.general().click();
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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

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
				await admin.goto('/admin');
				await admin.usersLink().click();
			});

			test('expect find registered user', async () => {
				await admin.usersFilter().type(registerUser.email, { delay: 200 });
				await admin.userInTable(registerUser.email).click();
			});

			test('expect activate registered user', async () => {
				await admin.userInfoActions().locator('button:nth-child(3)').click();
				await admin.getPage().locator('[value="changeActiveStatus"]').click();
			});

			test('expect deactivate registered user', async () => {
				await admin.userInfoActions().locator('button:nth-child(3)').click();
				await admin.getPage().locator('[value="changeActiveStatus"]').click();
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
