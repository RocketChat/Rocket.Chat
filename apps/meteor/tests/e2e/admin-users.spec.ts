import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

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
		const poAdmin = new Admin(page);
		await page.goto('/admin/users');

		const { username } = await createUser(poAdmin);

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

async function createUser(poAdmin: Admin) {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const email = faker.internet.email({ firstName, lastName });
	const username = faker.internet.userName({ firstName, lastName });
	const password = faker.internet.password();

	await poAdmin.tabs.users.btnNewUser.click();
	await poAdmin.tabs.users.inputEmail.fill(email);
	await poAdmin.tabs.users.inputName.fill(firstName);
	await poAdmin.tabs.users.inputUserName.fill(username);
	await poAdmin.tabs.users.inputSetManually.click();
	await poAdmin.tabs.users.inputPassword.fill(password);
	await poAdmin.tabs.users.inputConfirmPassword.fill(password);
	await poAdmin.tabs.users.btnSave.click();

	return {
		email,
		firstName,
		lastName,
		username,
		password,
	};
}
