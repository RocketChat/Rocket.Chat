import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { Admin, Registration, Utils } from './page-objects';
import { test, expect } from './utils/test';

let user: IUser & { username: string };
let password: string;
let admin: Admin;

test.beforeAll('Create a new user', async ({ api }) => {
	password = faker.internet.password();
	const response = await api.post('/users.create', {
		email: faker.internet.email(),
		name: faker.person.fullName(),
		password,
		username: faker.internet.userName(),
	});
	expect(response.status()).toBe(200);
	const json = await response.json();
	user = json.user;
});

test.afterAll('Delete the new user', async ({ api }) => {
	const response = await api.post('/users.delete', { userId: user._id });
	expect(response.status()).toBe(200);
});

test.describe('Admin > Users', () => {
	test.use({ storageState: Users.admin.state });

	test.beforeEach('Go to /admin/users', async ({ page }) => {
		admin = new Admin(page);
		await page.goto('/admin/users');
	});

	test(
		'New user shows in correct tabs when deactivated',
		{
			tag: '@admin',
			annotation: {
				type: 'issue',
				description: 'https://rocketchat.atlassian.net/browse/SUP-775',
			},
		},
		async ({ page }) => {
			const { username } = user;
			await admin.tabs.users.inputSearch.fill(username);

			await test.step('is visible in the All tab', async () => {
				await admin.tabs.users.tabAll.click();
				await expect(admin.getUserRowByUsername(username)).toBeVisible();
			});

			await test.step('is visible in the Pending tab', async () => {
				await admin.tabs.users.tabPending.click();
				await expect(admin.getUserRowByUsername(username)).toBeVisible();
			});

			await test.step('is not visible in the Active tab', async () => {
				await admin.tabs.users.tabActive.click();
				await expect(admin.getUserRowByUsername(username)).not.toBeVisible();
			});

			await test.step('is not visible in the Deactivated tab', async () => {
				await admin.tabs.users.tabDeactivated.click();
				await expect(admin.getUserRowByUsername(username)).not.toBeVisible();
			});

			await test.step('moves from Pending to Deactivated tab', async () => {
				await page.getByRole('tab', { name: 'Pending' }).click();
				await admin.tabs.users.btnMoreActionsMenu.click();
				await admin.tabs.users.menuItemDeactivated.click();
				await expect(admin.getUserRowByUsername(username)).not.toBeVisible();
				await admin.tabs.users.tabDeactivated.click();
				await expect(admin.getUserRowByUsername(username)).toBeVisible();
			});

			await test.step('moves from Deactivated to Pending tab', async () => {
				await admin.tabs.users.tabDeactivated.click();
				await admin.tabs.users.btnMoreActionsMenu.click();
				await admin.tabs.users.menuItemActivate.click();
				await expect(admin.getUserRowByUsername(username)).not.toBeVisible();
				await admin.tabs.users.tabPending.click();
				await expect(admin.getUserRowByUsername(username)).toBeVisible();
			});
		},
	);
});

test.describe('Login', () => {
	let poRegistration: Registration;
	let poUtils: Utils;
	test('Login as a newly created user and verify its status is active', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		poRegistration = new Registration(page);
		poUtils = new Utils(page);

		await test.step('should log in as the newly created user', async () => {
			await page.goto('/login');
			await poRegistration.username.fill(user.username);
			await poRegistration.inputPassword.fill(password);
			await poRegistration.btnLogin.click();
		});

		await test.step('Assert user is logged in', async () => {
			await expect(poUtils.mainContent).toBeVisible();
		});

		await test.step('close browser', async () => {
			await context.close();
		});
	});
});

test.describe('Login as a admin and verify registration status', () => {
	test.use({ storageState: Users.admin.state });

	test.beforeEach('Go to /admin/users', async ({ page }) => {
		admin = new Admin(page);
		await page.goto('/admin/users');
	});

	test('After the first login, the user gets listed under the Active tab', async () => {
		const { username } = user;
		await admin.tabs.users.inputSearch.fill(username);

		await test.step('is visible in the All tab', async () => {
			await admin.tabs.users.tabActive.click();
			await expect(admin.getUserRowByUsername(username)).toBeVisible();
		});

		await test.step('is not visible in the Pending tab', async () => {
			await admin.tabs.users.tabPending.click();
			await expect(admin.getUserRowByUsername(username)).not.toBeVisible();
		});

		await test.step('is visible in the Active tab', async () => {
			await admin.tabs.users.tabActive.click();
			await expect(admin.getUserRowByUsername(username)).toBeVisible();
		});

		await test.step('is not visible in the Deactivated tab', async () => {
			await admin.tabs.users.tabDeactivated.click();
			await expect(admin.getUserRowByUsername(username)).not.toBeVisible();
		});
	});

	test('Make a newly created user as admin', async () => {
		const { username } = user;
		await admin.tabs.users.inputSearch.fill(username);

		await test.step('User is visible in the All tab', async () => {
			await admin.tabs.users.tabAll.click();
			await expect(admin.getUserRowByUsername(username)).toBeVisible();
		});

		await test.step('make a user admin', async () => {
			await admin.tabs.users.openUserActionMenu(username);
			await admin.tabs.users.menuItemMakeAdmin.click();
			await expect(admin.tabs.users.toastMessage).toContainText('User is now an admin');
		});

		await test.step('verify user is admin', async () => {
			await admin.tabs.users.getUserRowByUsername(username).click();
			await expect(admin.tabs.users.openDialog).toBeVisible();
			await expect(admin.tabs.users.openDialog).toContainText('Admin');
		});
	});

	test('Remove role as admin', async () => {
		const { username } = user;
		await admin.tabs.users.inputSearch.fill(username);
		await test.step('User is visible in the All tab', async () => {
			await admin.tabs.users.tabAll.click();
			await expect(admin.getUserRowByUsername(username)).toBeVisible();
		});

		await test.step('remove admin role', async () => {
			await admin.tabs.users.openUserActionMenu(username);
			await admin.tabs.users.menuItemRemoveAdmin.click();
			await expect(admin.tabs.users.toastMessage).toHaveText('User is no longer an admin');
		});

		await test.step('verify user role as admin is removed', async () => {
			await admin.tabs.users.getUserRowByUsername(username).click();
			await expect(admin.tabs.users.openDialog).toBeVisible();
			await expect(admin.tabs.users.openDialog).not.toHaveText('Admin');
		});
	});
});
