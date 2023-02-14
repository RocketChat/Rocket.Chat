import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Locator, Page } from '@playwright/test';
import faker from '@faker-js/faker';

import { test, expect } from './utils/test';
import { setSettingValueById } from './utils/setSettingValueById';
import { HomeChannel } from './page-objects';

test.use({ storageState: 'admin-session.json' });

const userData = {
	username: faker.datatype.uuid(),
	name: faker.name.firstName(),
	email: faker.internet.email(),
	password: faker.internet.password(),
};

// There currently are over 33 system messages. Testing only a couple due to test being too slow right now.
// Ideally, we should test all.
test.describe.serial('System Messages', () => {
	let adminPage: Page;
	let poHomeChannel: HomeChannel;
	let group: IRoom;
	let user: IUser;

	const findSysMes = (id: string): Locator => {
		return adminPage.locator(`[data-qa="system-message"][data-system-message-type="${id}"]`);
	};

	test.beforeAll(async ({ api, browser }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', [])).status()).toBe(200);

		expect(
			(
				await api.post('/groups.create', { name: faker.datatype.uuid() }).then(async (response) => {
					group = (await response.json()).group;
					// console.log(group);
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

	test('expect "User added" system message to be visible', async ({ api }) => {
		expect((await api.post('/groups.invite', { roomId: group._id, userId: user._id })).status()).toBe(200);
		await expect(findSysMes('au')).toBeVisible();
	});

	test('expect "User added" system message to be hidden', async ({ api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', ['au'])).status()).toBe(200);
		await expect(findSysMes('au')).not.toBeVisible();
	});

	test('expect "User removed" system message to be visible', async ({ api }) => {
		expect((await api.post('/groups.kick', { roomId: group._id, userId: user._id })).status()).toBe(200);
		await expect(findSysMes('ru')).toBeVisible();
	});

	test('expect "User removed" system message to be hidden', async ({ api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', ['ru'])).status()).toBe(200);
		await expect(findSysMes('ru')).not.toBeVisible();
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/groups.delete', { roomId: group._id })).status()).toBe(200);
	});
});
