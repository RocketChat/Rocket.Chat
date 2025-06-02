import { faker } from '@faker-js/faker';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Credentials } from '@rocket.chat/api-client';
import type { TestUser } from '../data/users.helper';
import { createUser, deleteUser, login } from '../data/users.helper';
import { createRoom, deleteRoom } from '../data/rooms.helper';

import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { Directory } from './page-objects/directory';
import { password } from '../data/user';
//import { Users } from './fixtures/userStates';
//import { createTargetChannel, createTargetPrivateChannel } from './utils';

test.describe.serial('private-rooms-override', () => {
    let poHomeChannel: HomeChannel;
    let poDirectory: Directory;
    let testUser: TestUser<IUser>;
    let adminUser: TestUser<IUser>;
    let testUserCredentials: Credentials;
    let privateRoom: IRoom;

    test.beforeAll(async ({ api }) => {
        // Create test users
        // testUser = await createUser({ 
        //     username: faker.internet.userName(),
        //     password: faker.internet.password(),
        //     roles: ['admin']
        // });
        testUser = await createUser();
		testUserCredentials = await login(testUser.username, password);
        
        // Set required permission
        await api.post('/permissions.update', {
            permissions: [{
                _id: 'view-all-private-rooms',
                roles: ['admin']
            }]
        });

        // Create a private room for testing
        privateRoom = (await createRoom({
            type: 'p',
            name: `private-room-${faker.string.uuid()}`,
            credentials: testUserCredentials
        })).body.group;
    });

    test.beforeEach(async ({ page }) => {
        poHomeChannel = new HomeChannel(page);
        poDirectory = new Directory(page);
        await page.goto('/home');
    });

    test.afterAll(async ({ api }) => {
        await Promise.all([
            // Delete test room
            deleteRoom({ type: 'p', roomId: privateRoom._id }),
            // Delete test user
            deleteUser(testUser),
            // Reset permission
            api.post('/permissions.update', {
                permissions: [{
                    _id: 'view-all-private-rooms',
                    roles: ['admin']
                }]
            })
        ]);
    });

    test('should show all private rooms in directory regardless of membership', async ({ page }) => {
        // Navigate to directory page
        await poDirectory.goto();
        
        // Switch to channels tab
        await poDirectory.toggleChannelsTab();
        
        // Verify private room is visible
        await expect(page.locator(`[data-qa="directory-channel-row=${privateRoom.name}"]`)).toBeVisible();
        
        // Verify room details are correctly displayed
        const roomRow = page.locator(`[data-qa="directory-channel-row=${privateRoom.name}"]`);
        await expect(roomRow.locator('[data-qa="directory-channel-name"]')).toHaveText(privateRoom.name!);
        await expect(roomRow.locator('[data-qa="directory-channel-type"]')).toHaveText('Private');
        
        // Attempt to access the room
        await roomRow.click();
        
        // Verify room is accessible
        await expect(page).toHaveURL(`/group/${privateRoom.name}`);
    });

    test('should respect view-all-private-rooms permission', async ({ page, api }) => {
        // Remove view-all-private-rooms permission
        await api.post('/permissions.update', {
            permissions: [{
                _id: 'view-all-private-rooms',
                roles: []
            }]
        });
        
        // Navigate to directory page
        await poDirectory.goto();
        await poDirectory.toggleChannelsTab();
        
        // Verify private room is not visible
        await expect(page.locator(`[data-qa="directory-channel-row=${privateRoom.name}"]`)).not.toBeVisible();
        
        // Restore permission
        await api.post('/permissions.update', {
            permissions: [{
                _id: 'view-all-private-rooms',
                roles: ['admin']
            }]
        });
        
        // Refresh the page
        await page.reload();
        
        // Verify private room is visible again
        await expect(page.locator(`[data-qa="directory-channel-row=${privateRoom.name}"]`)).toBeVisible();
    });
});
