import { faker } from '@faker-js/faker';
import type { ITeam } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
// import { HomeChannel } from './page-objects';
// import { Directory } from './page-objects/directory';
import { test, expect } from './utils/test';

// Use admin state - this user is already created in global settings
test.use({ storageState: Users.admin.state });

test.describe('private-teams-override', () => {
	// let poHomeChannel: HomeChannel;
	// let poDirectory: Directory;
	let privateTeam: ITeam;
	let otherPrivateTeam: ITeam;

	test.beforeAll('Create private teams', async ({ api }) => {
		// Create user1 API client
		const user1Api = await api.login({ username: 'user1', password: 'password' });

		// Set permissions
		await api.post('/permissions.update', {
			permissions: [
				{
					_id: 'view-all-p-room',
					roles: ['admin'],
				},
			],
		});

		// Create first private team (admin is a member)
		const createTeamResponse = await api.post('/teams.create', {
			name: `private-team-${faker.string.uuid()}`,
			type: 1, // Private team
			members: ['user3'], // Add user3 as initial member
		});
		expect(createTeamResponse.status()).toBe(200);
		privateTeam = (await createTeamResponse.json()).team;

		// Create second private team with user1 (admin is NOT a member)
		const createOtherTeamResponse = await user1Api.post('/api/v1/teams.create', {
			data: {
				name: `other-team-${faker.string.uuid()}`,
				type: 1, // Private team
				members: ['user3'], // Add user3 as initial member
			},
		});
		expect(createOtherTeamResponse.status()).toBe(200);
		otherPrivateTeam = (await createOtherTeamResponse.json()).team;
	});

	test.beforeEach(async ({ page }) => {
		// poHomeChannel = new HomeChannel(page);
		// poDirectory = new Directory(page);
		await page.goto('/home');
	});

	test.afterAll('Cleanup teams', async ({ api }) => {
		// Create user1 API client
		const user1Api = await api.login({ username: 'user1', password: 'password' });

		// Clean up test data (teams)
		await Promise.all([
			api.post('/teams.delete', { teamName: privateTeam.name }),
			user1Api.post('/api/v1/teams.delete', { data: { teamName: otherPrivateTeam.name } }),
		]);
	});

	test('should handle private teams visibility based on permissions', async ({ page, api }) => {
		await test.step('Navigate to directory teams', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			// Wait for teams directory page to load
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
		});

		await test.step('Search and verify own private team is visible', async () => {
			// Use search function to isolate target team
			await page.getByRole('textbox', { name: 'Search' }).fill(privateTeam.name!);

			const teamRow = page.getByRole('table').getByRole('link').filter({ hasText: privateTeam.name! });
			await expect(teamRow).toBeVisible();

			// Test team access
			await teamRow.click();
			await expect(page).toHaveURL(`/group/${privateTeam.name}`);

			// Return to directory teams page
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
		});

		await test.step('Search and verify other private team is visible with view-all-p-room permission', async () => {
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);

			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).toBeVisible();
		});

		await test.step('Remove view-all-p-room permission', async () => {
			await api.post('/permissions.update', {
				permissions: [
					{
						_id: 'view-all-p-room',
						roles: [],
					},
				],
			});
		});

		await test.step('Verify permission change - own team still visible, other team hidden', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Own team should still be visible (because user is a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(privateTeam.name!);
			const ownTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: privateTeam.name! });
			await expect(ownTeamRow).toBeVisible();

			// Other team should not be visible (no permission and not a member)
			await page.getByRole('textbox', { name: 'Search' }).clear();
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);
			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).not.toBeVisible();
		});

		await test.step('Restore permission and verify both teams visible again', async () => {
			await api.post('/permissions.update', {
				permissions: [
					{
						_id: 'view-all-p-room',
						roles: ['admin'],
					},
				],
			});

			await page.reload();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search and verify other team is visible again
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);
			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).toBeVisible();
		});
	});

	test('should allow admin to manage members (add and remove) in private team', async ({ page }) => {
		await test.step('Navigate to directory and access the private team created by user1', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private team created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);

			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).toBeVisible();

			// Click to enter the team
			await otherTeamRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateTeam.name}`);
		});

		await test.step('Open team members and access member management', async () => {
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
			// If already "All", do nothing

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

			// Click "Remove from team" option (different from room)
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

	test('should allow admin to manage owner permissions in private team', async ({ page }) => {
		await test.step('Navigate to directory and access the private team created by user1', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private team created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);

			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).toBeVisible();

			// Click to enter the team
			await otherTeamRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateTeam.name}`);
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

	test('should allow admin to manage leader permissions in private team', async ({ page }) => {
		await test.step('Navigate to directory and access the private team created by user1', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private team created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);

			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).toBeVisible();

			// Click to enter the team
			await otherTeamRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateTeam.name}`);
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

	test('should allow admin to manage moderator permissions in private team', async ({ page }) => {
		await test.step('Navigate to directory and access the private team created by user1', async () => {
			await page.getByRole('button', { name: 'Directory', exact: true }).click();
			await page.getByRole('tab', { name: 'Teams' }).click();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private team created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateTeam.name!);

			const otherTeamRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateTeam.name! });
			await expect(otherTeamRow).toBeVisible();

			// Click to enter the team
			await otherTeamRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateTeam.name}`);
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

// await page.getByRole('button', { name: 'Directory', exact: true }).click();
// await page.getByRole('tab', { name: 'Teams' }).click();
// await page.getByRole('link', { name: 'E2EEWithoutAdminTeam' }).click();
// await page.getByRole('toolbar', { name: 'Primary Room actions' }).getByLabel('Options').click();
// await page.getByText('Teams Members').click();
// await page.getByRole('button', { name: 'Online' }).click();
// await page.getByText('All', { exact: true }).click();
