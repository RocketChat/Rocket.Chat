import { faker } from '@faker-js/faker';
import type { IRoom } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { Directory } from './page-objects/directory';
import { test, expect } from './utils/test';

// Use admin state - this user is already created in global settings
test.use({ storageState: Users.admin.state });

test.describe('private-rooms-override', () => {
	let poHomeChannel: HomeChannel;
	let poDirectory: Directory;
	let privateRoom: IRoom;
	let otherPrivateRoom: IRoom;

	test.beforeAll('Create private rooms', async ({ api }) => {
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

		// Create first private room (admin is a member)
		const createRoomResponse = await api.post('/groups.create', {
			name: `private-room-${faker.string.uuid()}`,
		});
		expect(createRoomResponse.status()).toBe(200);
		privateRoom = (await createRoomResponse.json()).group;

		// Create second private room with user1 (admin is NOT a member)
		const createOtherRoomResponse = await user1Api.post('/api/v1/groups.create', {
			data: {
				name: `other-room-${faker.string.uuid()}`,
				members: ['user3'], // Add user3 as initial member
			},
		});
		expect(createOtherRoomResponse.status()).toBe(200);
		otherPrivateRoom = (await createOtherRoomResponse.json()).group;
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poDirectory = new Directory(page);
		await page.goto('/home');
	});

	test.afterAll('Cleanup rooms', async ({ api }) => {
		// Create user1 API client
		const user1Api = await api.login({ username: 'user1', password: 'password' });

		// Clean up test data（channels）
		await Promise.all([
			api.post('/groups.delete', { roomId: privateRoom._id }),
			user1Api.post('/api/v1/groups.delete', { data: { roomId: otherPrivateRoom._id } }),
		]);
	});

	test('should handle private rooms visibility based on permissions', async ({ page, api }) => {
		await test.step('Navigate to directory', async () => {
			await poDirectory.goto();
			// Wait for directory page to load
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
		});

		await test.step('Search and verify own private room is visible', async () => {
			// Use search function to isolate target channel - following mentor's advice
			await page.getByRole('textbox', { name: 'Search' }).fill(privateRoom.name!);

			const roomRow = page.getByRole('table').getByRole('link').filter({ hasText: privateRoom.name! });
			await expect(roomRow).toBeVisible();

			// Test room access
			await roomRow.click();
			await expect(page).toHaveURL(`/group/${privateRoom.name}`);

			// Return to directory page
			await poDirectory.goto();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
		});

		await test.step('Search and verify other private room is visible with view-all-p-room permission', async () => {
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);

			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).toBeVisible();
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

		await test.step('Verify permission change - own room still visible, other room hidden', async () => {
			await poDirectory.goto();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Own room should still be visible (because user is a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(privateRoom.name!);
			const ownRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: privateRoom.name! });
			await expect(ownRoomRow).toBeVisible();

			// Other room should not be visible (no permission and not a member)
			await page.getByRole('textbox', { name: 'Search' }).clear();
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).not.toBeVisible();
		});

		await test.step('Restore permission and verify both rooms visible again', async () => {
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

			// Search and verify other room is visible again
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).toBeVisible();
		});
	});

	test('should allow admin to manage members (add and remove) in private room', async ({ page }) => {
		await test.step('Navigate to directory and access the private room created by user1', async () => {
			await poDirectory.goto();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private room created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);

			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).toBeVisible();

			// Click to enter the room
			await otherRoomRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateRoom.name}`);
		});

		await test.step('Open members tab and access member management', async () => {
			await poHomeChannel.tabs.btnTabMembers.click();
			// Wait for the members panel to be visible with the blue header
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

		await test.step('Add user2 to the room', async () => {
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

		await test.step('Remove user2 from the room', async () => {
			await page.getByLabel('Members').getByText('user2').hover();

			await page.getByLabel('Members').getByText('user2').locator('..').getByRole('button', { name: 'More' }).click({ timeout: 10000 });

			// Click "Remove from room" option
			await page.getByText('Remove from room').click();

			await page.getByRole('button', { name: 'Yes, remove user!' }).click();
		});

		await test.step('Verify user2 is removed from Members panel', async () => {
			// Wait for user2 to disappear from the members list
			await expect(page.getByLabel('Members').getByText('user2')).not.toBeVisible();

			// Verify that original members are still in the room (sanity check)
			await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
			await expect(page.getByLabel('Members').getByText('user3')).toBeVisible();
		});
	});

	test('should allow admin to manage owner permissions in private room', async ({ page }) => {
		await test.step('Navigate to directory and access the private room created by user1', async () => {
			await poDirectory.goto();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private room created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);

			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).toBeVisible();

			// Click to enter the room
			await otherRoomRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateRoom.name}`);
		});

		await test.step('Open members tab and verify initial state', async () => {
			await poHomeChannel.tabs.btnTabMembers.click();
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

	test('should allow admin to manage leader permissions in private room', async ({ page }) => {
		await test.step('Navigate to directory and access the private room created by user1', async () => {
			await poDirectory.goto();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private room created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);

			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).toBeVisible();

			// Click to enter the room
			await otherRoomRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateRoom.name}`);
		});

		await test.step('Open members tab and verify initial state', async () => {
			await poHomeChannel.tabs.btnTabMembers.click();
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

	test('should allow admin to manage moderator permissions in private room', async ({ page }) => {
		await test.step('Navigate to directory and access the private room created by user1', async () => {
			await poDirectory.goto();
			await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();

			// Search for the private room created by user1 (admin is NOT a member)
			await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);

			const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
			await expect(otherRoomRow).toBeVisible();

			// Click to enter the room
			await otherRoomRow.click();
			await expect(page).toHaveURL(`/group/${otherPrivateRoom.name}`);
		});

		await test.step('Open members tab and verify initial state', async () => {
			await poHomeChannel.tabs.btnTabMembers.click();
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
