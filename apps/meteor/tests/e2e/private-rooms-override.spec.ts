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
            await page.waitForLoadState('networkidle');
        });

        await test.step('Search and verify own private room is visible', async () => {
            // Use search function to isolate target channel - following mentor's advice
            await page.getByRole('textbox', { name: 'Search' }).fill(privateRoom.name!);
            await page.waitForLoadState('networkidle');
            
            const roomRow = page.getByRole('table').getByRole('link').filter({ hasText: privateRoom.name! });
            await expect(roomRow).toBeVisible();
            
            // Test room access
            await roomRow.click();
            await expect(page).toHaveURL(`/group/${privateRoom.name}`);
            
            // Return to directory page
            await poDirectory.goto();
        });

        await test.step('Search and verify other private room is visible with view-all-p-room permission', async () => {
            await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
            await page.waitForLoadState('networkidle');
            
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
            await page.waitForLoadState('networkidle');
            
            // Own room should still be visible (because user is a member)
            await page.getByRole('textbox', { name: 'Search' }).fill(privateRoom.name!);
            await page.waitForLoadState('networkidle');
            const ownRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: privateRoom.name! });
            await expect(ownRoomRow).toBeVisible();
            
            // Other room should not be visible (no permission and not a member)
            await page.getByRole('textbox', { name: 'Search' }).clear();
            await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
            await page.waitForLoadState('networkidle');
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
            await page.waitForLoadState('networkidle');
            
            // Search and verify other room is visible again
            await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
            await page.waitForLoadState('networkidle');
            const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
            await expect(otherRoomRow).toBeVisible();
        });
    });

    test('should allow admin to assign roles in private room accessed via directory', async ({ page, api }) => {
        await test.step('Navigate to directory and access the private room created by user1', async () => {
            await poDirectory.goto();
            await page.waitForLoadState('networkidle');
            
            // Search for the private room created by user1 (admin is NOT a member)
            await page.getByRole('textbox', { name: 'Search' }).fill(otherPrivateRoom.name!);
            await page.waitForLoadState('networkidle');
            
            const otherRoomRow = page.getByRole('table').getByRole('link').filter({ hasText: otherPrivateRoom.name! });
            await expect(otherRoomRow).toBeVisible();
            
            // Click to enter the room
            await otherRoomRow.click();
            await expect(page).toHaveURL(`/group/${otherPrivateRoom.name}`);
        });

        await test.step('Open members tab and access user1 info', async () => {
            // Open the Members tab
            await poHomeChannel.tabs.btnTabMembers.click();
            await page.waitForLoadState('networkidle');
            
            // Look for user1 in the members list and click on them
            const user1Element = page.locator('[data-qa="MemberItem-user1"]').first();
            await expect(user1Element).toBeVisible();
            await user1Element.click();
        });

        
    });
});
