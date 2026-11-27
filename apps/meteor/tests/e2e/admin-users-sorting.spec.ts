import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { AdminUsers } from './page-objects';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser } from './utils/user-helpers';

test.use({ storageState: Users.admin.state });

test.describe('Admin > Users > Sorting', () => {
	preserveSettings(['Accounts_RequireNameForSignUp']);

	const token = faker.string.alpha({ length: 8, casing: 'lower' });
	const namelessUsername = `Cindy-${token}`;
	const sortedNames = ['Carry', 'Chelsea', 'cicero', namelessUsername, 'Colleen', 'Columbus'];
	const ascending = sortedNames.map((name) => new RegExp(`^${name}`));

	let users: ITestUser[] = [];
	let adminUsers: AdminUsers;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_RequireNameForSignUp', false);

		users = await Promise.all([
			createTestUser(api, { name: 'Columbus', username: `columbus-${token}` }),
			createTestUser(api, { name: 'cicero', username: `cicero-${token}` }),
			createTestUser(api, { username: namelessUsername, data: { name: '' } }),
			createTestUser(api, { name: 'Colleen', username: `colleen-${token}` }),
			createTestUser(api, { name: 'Chelsea', username: `chelsea-${token}` }),
			createTestUser(api, { name: 'Carry', username: `carry-${token}` }),
		]);
	});

	test.afterAll(async () => {
		await Promise.all(users.map((user) => user.delete()));
	});

	test.beforeEach(async ({ page }) => {
		adminUsers = new AdminUsers(page);
		await adminUsers.goto();
		await adminUsers.filterUsers(token);
	});

	test('sorts by the displayed name ignoring case, falling back to the username', async () => {
		await test.step('ascending', async () => {
			await expect(adminUsers.userRows).toHaveText(ascending);
		});

		await test.step('descending', async () => {
			await adminUsers.getColumnHeader('Name').click();

			await expect(adminUsers.userRows).toHaveText([...ascending].reverse());
		});
	});

	test('sorts by username ignoring case', async () => {
		await adminUsers.getColumnHeader('Username').click();

		await expect(adminUsers.userRows).toHaveText(ascending);
	});
});
