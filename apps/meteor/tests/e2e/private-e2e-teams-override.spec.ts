import { faker } from '@faker-js/faker';
import type { ITeam } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('private-e2e-teams-override', () => {
	let encryptedTeam: ITeam;
	// to denote if E2E is disabled
	let e2eDisabled = false;

	test.beforeAll('Create encrypted private team and set permissions', async ({ api }) => {
		const user1Api = await api.login({ username: 'user1', password: 'password' });
		// set view-all-p-room permission
		await api.post('/permissions.update', {
			permissions: [
				{
					_id: 'view-all-p-room',
					roles: ['admin'],
				},
			],
		});
		// create encrypted team
		const createEncryptedTeamResponse = await user1Api.post('/api/v1/teams.create', {
			data: {
				name: `encrypted-team-${faker.string.uuid()}`,
				type: 1, // Private team
				members: ['user3'],
				room: {
					extraData: {
						encrypted: true,
					},
				},
			},
		});
		expect(createEncryptedTeamResponse.status()).toBe(200);
		encryptedTeam = (await createEncryptedTeamResponse.json()).team;
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/home');
	});

	test.afterAll('Cleanup encrypted team', async ({ api }) => {
		const user1Api = await api.login({ username: 'user1', password: 'password' });
		await user1Api.post('/api/v1/teams.delete', { data: { teamName: encryptedTeam.name } });
	});

	// must disable E2E first
	test('should allow admin to disable E2E encryption in encrypted private team', async ({ page }) => {
		await test.step('Navigate to directory teams and verify encrypted team is visible', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Search' }).fill(encryptedTeam.name ?? '');
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await expect(encryptedTeamRow).toBeVisible();
		});

		await test.step('Access encrypted team and verify E2E password prompt', async () => {
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await encryptedTeamRow.click();
			await expect(page.getByRole('link', { name: 'Learn more about E2EE' })).toBeVisible();
		});

		await test.step('Disable E2E encryption', async () => {
			await page.getByRole('button', { name: 'Disable E2E' }).click();
			await page.getByRole('button', { name: 'Disable encryption' }).click();
		});

		await test.step('Verify E2E encryption is disabled', async () => {
			await expect(page).toHaveURL(`/group/${encryptedTeam.name}`);
			await page.reload();
			await expect(page.getByText('disabled E2E Encryption for this room')).toBeVisible();
			e2eDisabled = true;
		});

		await test.step('Return to directory and verify team is still accessible', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Search' }).fill(encryptedTeam.name ?? '');
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await expect(encryptedTeamRow).toBeVisible();
			await encryptedTeamRow.click();
			await expect(page).toHaveURL(`/group/${encryptedTeam.name}`);
			await expect(page.getByText('Enter your end-to-end encryption password to access')).not.toBeVisible();
		});
	});

	test('should allow admin to manage members (add and remove) in encrypted private team', async ({ page }) => {
		expect(e2eDisabled).toBe(true);
		await test.step('Navigate to directory and access the encrypted private team', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Search' }).fill(encryptedTeam.name ?? '');
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await expect(encryptedTeamRow).toBeVisible();
			await encryptedTeamRow.click();
			await expect(page).toHaveURL(`/group/${encryptedTeam.name}`);
		});

		await test.step('Open team members and access member management', async () => {
			// Access team members
			await page.getByRole('toolbar', { name: 'Primary Room actions' }).getByLabel('Options').click();
			await page.getByText('Teams Members').click();

			// Wait for the members panel to be visible
			await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

			// Check if filter is "Online" and switch to "All" if needed to see offline users
			const onlineFilter = page.getByLabel('Online', { exact: true });
			const isOnlineVisible = await onlineFilter.isVisible();

			if (isOnlineVisible) {
				// If "Online" filter is active, switch to "All"
				await onlineFilter.click();
				await page.getByText('All', { exact: true }).click();
			}

			// Verify initial members (user1 as owner, user3 as initial member)
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();
		});

		await test.step('Add user2 to the team', async () => {
			// Click the "Add" button in the members panel
			const addButton = page.getByRole('button', { name: 'Add' });
			await expect(addButton).toBeVisible();
			await addButton.click();

			// Wait for the page full load
			await expect(page.getByRole('button', { name: 'Add users' })).toBeVisible();
			await expect(page.getByPlaceholder('Choose users')).toBeVisible();

			// select user2 and add
			await page.getByPlaceholder('Choose users').fill('user2');
			await page.getByRole('option', { name: 'user2 (user2)' }).locator('div').first().click();
			const addUsersButton = page.getByRole('button', { name: 'Add users' });
			await expect(addUsersButton).toBeVisible();
			await addUsersButton.click();
		});

		await test.step('Verify user2 appears in Members panel', async () => {
			await expect(page.getByLabel('Members').getByText('user2')).toBeVisible();
		});

		await test.step('Remove user2 from the team', async () => {
			await page.getByLabel('Members').getByText('user2').hover();

			await page.getByLabel('Members').getByText('user2').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });

			// Click "Remove from team" option
			await page.getByText('Remove from team').click();
			await page.getByRole('button', { name: 'Remove' }).click();
		});

		await test.step('Verify user2 is removed from Members panel', async () => {
			// Wait for user2 to disappear from the members list
			await expect(page.getByLabel('Members').getByText('user2')).not.toBeVisible();

			// Verify that original members are still in the team (sanity check)
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();
		});
	});

	test('should allow admin to manage owner permissions in encrypted private team', async ({ page }) => {
		expect(e2eDisabled).toBe(true);
		await test.step('Navigate to directory and access the encrypted private team', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Search' }).fill(encryptedTeam.name ?? '');
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await expect(encryptedTeamRow).toBeVisible();
			await encryptedTeamRow.click();
			await expect(page).toHaveURL(`/group/${encryptedTeam.name}`);
		});

		await test.step('Open team members and verify initial state', async () => {
			// Access team members using the recorded locators
			await page.getByRole('toolbar', { name: 'Primary Room actions' }).getByLabel('Options').click();
			await page.getByText('Teams Members').click();

			// Wait for the members panel to be visible
			await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

			// Check if filter is "Online" and switch to "All" if needed to see offline users
			const onlineFilter = page.getByLabel('Online', { exact: true });
			const isOnlineVisible = await onlineFilter.isVisible();

			if (isOnlineVisible) {
				// If "Online" filter is active, switch to "All"
				await onlineFilter.click();
				await page.getByText('All', { exact: true }).click();
			}

			// Verify initial state: user1 is owner, user3 is member
			await expect(page.getByText('Owners')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();
		});

		await test.step('Set user3 as owner', async () => {
			// Hover over user3 to make the More button visible
			await page.getByLabel('Members').getByText('user3').hover();

			// Click the more options button (three dots) next to user3
			await page.getByLabel('Members').getByText('user3').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });

			// Click "Set as owner" option
			await page.getByText('Set as owner').click();
		});

		await test.step('Verify user3 is now owner', async () => {
			// Wait for the UI to update and verify user3 is now in Owners section
			await expect(page.getByText('Owners').locator('..').getByText('2')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			// If user3 is now owner, should see "Remove as owner" option
			await page.getByLabel('Members').getByText('user3').hover();
			await page.getByLabel('Members').getByText('user3').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });

			await expect(page.getByText('Remove as owner')).toBeVisible();
		});

		await test.step('Remove user3 as owner', async () => {
			await page.getByText('Remove as owner').click();
		});

		await test.step('Verify user3 is back to member', async () => {
			// verify the state is back to initial
			await expect(page.getByText('Owners').locator('..').getByText('1', { exact: true })).toBeVisible();
			await expect(page.getByText('Members').locator('..').getByText('1', { exact: true })).toBeVisible();
		});
	});

	test('should allow admin to manage leader permissions in encrypted private team', async ({ page }) => {
		expect(e2eDisabled).toBe(true);
		await test.step('Navigate to directory and access the encrypted private team', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Search' }).fill(encryptedTeam.name ?? '');
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await expect(encryptedTeamRow).toBeVisible();
			await encryptedTeamRow.click();
			await expect(page).toHaveURL(`/group/${encryptedTeam.name}`);
		});

		await test.step('Open team members and verify initial state', async () => {
			// Access team members using the recorded locators
			await page.getByRole('toolbar', { name: 'Primary Room actions' }).getByLabel('Options').click();
			await page.getByText('Teams Members').click();

			// Wait for the members panel to be visible
			await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

			// Check if filter is "Online" and switch to "All" if needed to see offline users
			const onlineFilter = page.getByLabel('Online', { exact: true });
			const isOnlineVisible = await onlineFilter.isVisible();

			if (isOnlineVisible) {
				// If "Online" filter is active, switch to "All"
				await onlineFilter.click();
				await page.getByText('All', { exact: true }).click();
			}

			// Verify initial state: user1 is owner, user3 is member
			await expect(page.getByText('Owners')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();
		});

		await test.step('Set user3 as leader', async () => {
			// Click "Set as leader" option
			await page.getByLabel('Members').getByText('user3').hover();
			await page.getByLabel('Members').getByText('user3').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });
			await page.getByText('Set as leader').click();
		});

		await test.step('Verify user3 is now leader', async () => {
			// Wait for the UI to update and verify user3 is now in Leaders section
			await expect(page.getByText('Leaders').locator('..').getByText('1', { exact: true })).toBeVisible();

			// Verify both users are still visible in the Members area
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();

			// If user3 is now leader, should see "Remove as leader" option
			await page.getByLabel('Members').getByText('user3').hover();
			await page.getByLabel('Members').getByText('user3').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });

			await expect(page.getByText('Remove as leader')).toBeVisible();
		});

		await test.step('Remove user3 as leader', async () => {
			// Click "Remove as leader" option
			await page.getByText('Remove as leader').click();
		});

		await test.step('Verify user3 is back to member', async () => {
			// Wait for the UI to update and verify the state is back to initial
			await expect(page.getByText('Owners').locator('..').getByText('1', { exact: true })).toBeVisible();
			await expect(page.getByText('Members').locator('..').getByText('1', { exact: true })).toBeVisible();
		});
	});

	test('should allow admin to manage moderator permissions in encrypted private team', async ({ page }) => {
		expect(e2eDisabled).toBe(true);
		await test.step('Navigate to directory and access the encrypted private team', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
			await page.getByRole('textbox', { name: 'Search' }).fill(encryptedTeam.name ?? '');
			const encryptedTeamRow = page
				.getByRole('table')
				.getByRole('link')
				.filter({ hasText: encryptedTeam.name ?? '' });
			await expect(encryptedTeamRow).toBeVisible();
			await encryptedTeamRow.click();
			await expect(page).toHaveURL(`/group/${encryptedTeam.name}`);
		});

		await test.step('Open team members and verify initial state', async () => {
			// Access team members using the recorded locators
			await page.getByRole('toolbar', { name: 'Primary Room actions' }).getByLabel('Options').click();
			await page.getByText('Teams Members').click();

			// Wait for the members panel to be visible
			await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

			// Check if filter is "Online" and switch to "All" if needed to see offline users
			const onlineFilter = page.getByLabel('Online', { exact: true });
			const isOnlineVisible = await onlineFilter.isVisible();

			if (isOnlineVisible) {
				// If "Online" filter is active, switch to "All"
				await onlineFilter.click();
				await page.getByText('All', { exact: true }).click();
			}

			// Verify initial state: user1 is owner, user3 is member
			await expect(page.getByText('Owners')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();
		});

		await test.step('Set user3 as moderator', async () => {
			// Click "Set as moderator" option
			await page.getByLabel('Members').getByText('user3').hover();
			await page.getByLabel('Members').getByText('user3').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });
			await page.getByText('Set as moderator').click();
		});

		await test.step('Verify user3 is now moderator', async () => {
			// Wait for the UI to update and verify user3 is now in Moderators section
			await expect(page.getByText('Moderators').locator('..').getByText('1', { exact: true })).toBeVisible();

			// Verify both users are still visible in the Members area
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();

			// If user3 is now moderator, should see "Remove as moderator" option
			await page.getByLabel('Members').getByText('user3').hover();
			await page.getByLabel('Members').getByText('user3').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });

			await expect(page.getByText('Remove as moderator')).toBeVisible();
		});

		await test.step('Remove user3 as moderator', async () => {
			// Click "Remove as moderator" option
			await page.getByText('Remove as moderator').click();
		});

		await test.step('Verify user3 is back to member', async () => {
			// Wait for the UI to update and verify the state is back to initial
			await expect(page.getByText('Owners').locator('..').getByText('1', { exact: true })).toBeVisible();
			await expect(page.getByText('Members').locator('..').getByText('1', { exact: true })).toBeVisible();
		});
	});
});
