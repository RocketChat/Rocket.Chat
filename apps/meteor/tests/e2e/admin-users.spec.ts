import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Admin > Users', () => {
	let user: IUser & { username: string };
	let pendingUsersCount: number;

	test.beforeAll('Create a new user', async ({ api }) => {
		const response = await api.post('/users.create', {
			email: faker.internet.email(),
			name: faker.person.fullName(),
			password: faker.internet.password(),
			username: faker.internet.userName(),
		});
		expect(response.status()).toBe(200);
		const json = await response.json();
		user = json.user;
		pendingUsersCount = await api
			.get('/users.listByStatus', {
				hasLoggedIn: false,
				status: 'active',
				type: 'user',
				count: 1,
			})
			.then((res) => res.json())
			.then((data) => data.total);
		expect(pendingUsersCount).toBeGreaterThan(0);
	});

	test.beforeEach('Go to /admin/users', async ({ page }) => {
		await page.goto('/admin/users');
	});

	test.afterAll('Delete the new user', async ({ api }) => {
		const response = await api.post('/users.delete', { userId: user._id });
		expect(response.status()).toBe(200);
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

			await page.getByPlaceholder('Search Users').fill(username);

			await test.step('is visible in the All tab', async () => {
				await page.getByRole('tab', { name: 'All' }).click();
				await expect(page.getByRole('link', { name: username })).toBeVisible();
			});

			await test.step('is visible in the Pending tab', async () => {
				await page.getByRole('tab', { name: `Pending (${pendingUsersCount})` }).click();
				await expect(page.getByRole('link', { name: username })).toBeVisible();
			});

			await test.step('is not visible in the Active tab', async () => {
				await page.getByRole('tab', { name: 'Active' }).click();
				await expect(page.getByRole('link', { name: username })).not.toBeVisible();
			});

			await test.step('is not visible in the Deactivated tab', async () => {
				await page.getByRole('tab', { name: 'Deactivated' }).click();
				await expect(page.getByRole('link', { name: username })).not.toBeVisible();
			});

			await test.step('moves from Pending to Deactivated tab', async () => {
				await page.getByRole('tab', { name: `Pending (${pendingUsersCount})` }).click();
				await expect(page.getByRole('link', { name: username })).toBeVisible();
				await page.getByRole('button', { name: 'More actions' }).click();
				await page.getByRole('menuitem', { name: 'Deactivate' }).click({ timeout: 1000 });
				await expect(page.getByRole('link', { name: username })).not.toBeVisible();
				await expect(page.getByRole('tab', { name: 'Pending' })).toHaveText(`Pending (${pendingUsersCount - 1})`);

				await page.getByRole('tab', { name: 'Deactivated' }).click();
				await expect(page.getByRole('link', { name: username })).toBeVisible();
			});

			await test.step('moves from Deactivated to Pending tab', async () => {
				await page.getByRole('tab', { name: 'Deactivated' }).click();
				await page.getByRole('button', { name: 'More actions' }).click();
				await page.getByRole('menuitem', { name: 'Activate' }).click();
				await expect(page.getByRole('link', { name: username })).not.toBeVisible();

				await page.getByRole('tab', { name: `Pending (${pendingUsersCount})` }).click();
				await expect(page.getByRole('link', { name: username })).toBeVisible();
			});
		},
	);
});
