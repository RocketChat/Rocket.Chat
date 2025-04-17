import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const user = {
	_id: undefined as string | undefined,
	username: faker.string.uuid(),
	name: faker.person.firstName(),
	email: faker.internet.email(),
	password: faker.internet.password(),
};

test.beforeAll('Create new user', async ({ api }) => {
	const response = await api.post('/users.create', user);
	expect(response.status()).toBe(200);
	const data = await response.json();
	user._id = data.user._id;
});

test.beforeEach('Open Admin > Users', async ({ page }) => {
	await page.goto('/admin/users');
});

test.afterAll('Delete new user', async ({ api }) => {
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
			await page.getByRole('tab', { name: 'Pending' }).click();
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
			await page.getByRole('tab', { name: 'Pending' }).click();
			await page.getByRole('button', { name: 'More actions' }).click();
			await page.getByRole('menuitem', { name: 'Deactivate' }).click();
			await expect(page.getByRole('link', { name: username })).not.toBeVisible();

			await page.getByRole('tab', { name: 'Deactivated' }).click();
			await expect(page.getByRole('link', { name: username })).toBeVisible();
		});

		await test.step('moves from Deactivated to Pending tab', async () => {
			await page.getByRole('tab', { name: 'Deactivated' }).click();
			await page.getByRole('button', { name: 'More actions' }).click();
			await page.getByRole('menuitem', { name: 'Activate' }).click();
			await expect(page.getByRole('link', { name: username })).not.toBeVisible();

			await page.getByRole('tab', { name: 'Pending' }).click();
			await expect(page.getByRole('link', { name: username })).toBeVisible();
		});
	},
);
