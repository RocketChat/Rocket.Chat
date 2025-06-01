import { faker } from '@faker-js/faker';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Credentials } from '@rocket.chat/api-client';
import type { TestUser } from '../data/users.helper';
import { createUser, deleteUser, login } from '../data/users.helper';
import { createRoom, deleteRoom } from '../data/rooms.helper';
import { password } from '../data/user';

import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { Directory } from './page-objects/directory';
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
        testUser = await createUser({ 
            username: faker.internet.userName(),
            roles: ['user']
        });
        
        // Set required permission
        await api.post('/permissions.update', {
            permissions: [{
                _id: 'view-all-private-rooms',
                roles: ['user']
            }]
        });

        // Get user credentials
        testUserCredentials = await login(testUser.username, password);

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
        // Visit the directory page as the test user
        // Navigate to channels tab
        // Verify private room is visible in the list
        // Verify room details are correctly displayed
        // Try to access the room
        // Verify appropriate access level is granted
    });

    test('should respect view-all-private-rooms permission', async ({ page }) => {
        // Remove view-all-private-rooms permission
        // Verify private room is no longer visible
        // Add back view-all-private-rooms permission
        // Verify private room becomes visible again
    });
});
