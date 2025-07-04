import { faker } from '@faker-js/faker';
import type { IRoom } from '@rocket.chat/core-typings';
import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { Directory } from './page-objects/directory';

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
            permissions: [{
                _id: 'view-all-p-room',
                roles: ['admin']
            }]
        });

        // Create first private room (admin is a member)
        const createRoomResponse = await api.post('/groups.create', {
            name: `private-room-${faker.string.uuid()}`
        });
        expect(createRoomResponse.status()).toBe(200);
        privateRoom = (await createRoomResponse.json()).group;

        // Create second private room with user1 (admin is NOT a member)
        const createOtherRoomResponse = await user1Api.post('/api/v1/groups.create', {
            data: {
                name: `other-room-${faker.string.uuid()}`
            }
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
                permissions: [{
                    _id: 'view-all-p-room',
                    roles: []
                }]
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
                permissions: [{
                    _id: 'view-all-p-room',
                    roles: ['admin']
                }]
            });
            
            await page.reload();
            await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
            
            // Search and verify other room is visible again
            await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
            const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
            await expect(otherRoomRow).toBeVisible();
        });
    });

    test('should allow admin to add user to private room via member management', async ({ page, api }) => {
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
            await expect(page.getByText('Members')).toBeVisible();
            
            // Check if filter is "Online" and switch to "All" if needed to see offline users
            const onlineFilter = page.getByLabel('Online', { exact: true });
            const isOnlineVisible = await onlineFilter.isVisible();
            
            if (isOnlineVisible) {
                // If "Online" filter is active, switch to "All"
                await onlineFilter.click();
                await page.getByText('All', { exact: true }).click();
            }
            // If already "All", do nothing
            
            await expect(page.getByLabel('Members').getByText('user1')).toBeVisible();
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
            // Wait for user2 to appear in the members list
            await expect(page.getByLabel('Members').getByText('user2')).toBeVisible();
        });
    });
});

