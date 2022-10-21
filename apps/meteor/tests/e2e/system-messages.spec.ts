import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { setSettingValueById } from './utils/setSettingValueById';
import { HomeChannel } from './page-objects';

// const SysMessagesTypeKeys = [
// 	'uj',
// 	'ujt',
// 	'ul',
// 	'ult',
// 	'ru',
// 	'removed-user-from-team',
// 	'au',
// 	'added-user-to-team',
// 	'mute_unmute',
// 	'r',
// 	'ut',
// 	'wm',
// 	'rm',
// 	'subscription-role-added',
// 	'subscription-role-removed',
// 	'room-archived',
// 	'room-unarchived',
// 	'room_changed_privacy',
// 	'room_changed_avatar',
// 	'room_changed_topic',
// 	'room_e2e_enabled',
// 	'room_e2e_disabled',
// 	'room-removed-read-only',
// 	'room-set-read-only',
// 	'room-disallowed-reacting',
// 	'room-allowed-reacting',
// 	'user-added-room-to-team',
// 	'user-converted-to-channel',
// 	'user-converted-to-team',
// 	'user-deleted-room-from-team',
// 	'user-removed-room-from-team',
// 	'room_changed_announcement',
// 	'room_changed_description',
// ];

test.use({ storageState: 'admin-session.json' });

const userData = {
	username: 'sysmestest',
	name: 'sysmestest',
	email: 'sysmestest@test.com',
	password: 'sysmestest',
};

test.describe.serial('System Messages', () => {
	let adminPage: Page;
	let poHomeChannel: HomeChannel;
	let group: IRoom;
	let user: IUser;

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', [])).status()).toBe(200);
	});

	test.describe('Private room', async () => {
		test.beforeAll(async ({ api, browser }) => {
			expect(
				(
					await api.post('/groups.create', { name: 'SystemMessagesTest' }).then(async (response) => {
						group = await response.json();
						return response;
					})
				).status(),
			).toBe(200);

			expect(
				(
					await api.post('/users.create', userData).then(async (result) => {
						user = (await result.json()).user;
						return result;
					})
				).status(),
			).toBe(200);

			adminPage = await browser.newPage({ storageState: 'admin-session.json' });
			poHomeChannel = new HomeChannel(adminPage);
		});

		test.beforeEach(async () => {
			if (!group.name) {
				return;
			}
			await adminPage.goto('/home');
			await poHomeChannel.sidenav.openChat(group.name as string);
		});

		test.describe('Add user', () => {
			test('expect "User added" system message to be visible', async ({ api }) => {
				expect((await api.post('/groups.invite', { roomId: group._id, userId: user._id })).status()).toBe(200);
				expect(await adminPage.locator('[data-qa="system-message"][data-qa-id="au"]')).toBeVisible();
			});

			test('expect "User added" system message to be hidden', async ({ api }) => {
				expect((await setSettingValueById(api, 'Hide_System_Messages', ['au'])).status()).toBe(200);
				expect(await adminPage.locator('[data-qa="system-message"][data-qa-id="au"]')).not.toBeVisible();
			});
		});

		test.describe('Remove user', () => {
			test('expect "User removed" system message to be visible', async ({ api }) => {
				expect((await api.post('/groups.kick', { roomId: group._id, userId: user._id })).status()).toBe(200);
				expect(await adminPage.locator('[data-qa="system-message"][data-qa-id="ru"]')).toBeVisible();
			});

			test('expect "User added" system message to be hidden', async ({ api }) => {
				expect((await setSettingValueById(api, 'Hide_System_Messages', ['ru'])).status()).toBe(200);
				expect(await adminPage.locator('[data-qa="system-message"][data-qa-id="ru"]')).not.toBeVisible();
			});
		});
	});

	// convert back to group before delete
	test.afterAll(async ({ api }) => {
		expect((await api.post('/groups.delete', { roomId: group._id })).status()).toBe(200);
	});
	// test.describe('Generate System Messages', () => {
	// 	test('expect all system message to be sent', async ({ api }) => {
	// 		expect(
	// 			(
	// 				await Promise.all(
	// 					SysMessagesTypeKeys.map((key) => {
	// 						return api.post('/chat.postMessage', { roomId: group._id, t: key,  }).then((result) => !!result.status);
	// 					}),
	// 				)
	// 			).filter(Boolean).length,
	// 		).toBe(SysMessagesTypeKeys.length);
	// 	});
	// 	for (const key of SysMessagesTypeKeys) {
	// 		// eslint-disable-next-line no-loop-func
	// 		test(`expect "${key}" system message to be sent`, async ({ api }) => {
	// 			expect((await api.post('/chat.postMessage', { roomId: group._id, t: key })).status()).toBe(200);
	// 		});
	// 	}
	// });

	// test.describe.serial('Check if System Messages are Visible', async () => {
	// 	test.beforeAll(async () => {
	// 		await adminPage.goto('/home');
	// 		await poHomeChannel.sidenav.openChat(group.name as string);
	// 	});

	// 	for (const key of SysMessagesTypeKeys) {
	// 		// eslint-disable-next-line no-loop-func
	// 		test(`expect "${key}" system message to be visible`, async () => {
	// 			expect(await adminPage.locator(`[data-qa="system-message"][data-qa-id="${key}"]`)).toBeVisible();
	// 		});
	// 	}
	// });

	// test.describe.serial('Hide all system messages', () => {
	// 	test.beforeAll(async ({ api }) => {
	// 		expect((await setSettingValueById(api, 'Hide_System_Messages', SysMessagesTypeKeys)).status()).toBe(200);
	// 		await adminPage.goto('/home');
	// 		await poHomeChannel.sidenav.openChat(group.name as string);
	// 	});
	// 	for (const key of SysMessagesTypeKeys) {
	// 		// eslint-disable-next-line no-loop-func
	// 		test(`expect "${key}" system message not to exist`, async () => {
	// 			expect(await adminPage.locator(`[data-qa="system-message"][data-qa-id="${key}"]`)).not.toBeVisible();
	// 		});
	// 	}
	// });
});
