import { faker } from '@faker-js/faker';
import type { Locator, Page } from '@playwright/test';
import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const userData = {
	username: faker.string.uuid(),
	name: faker.person.firstName(),
	email: faker.internet.email(),
	password: faker.internet.password(),
};

const findSysMes = (page: Page, id: string): Locator => page.locator(`[data-qa="system-message"][data-system-message-type="${id}"]`);

// There currently are over 33 system messages. Testing only a couple due to test being too slow right now.
// Ideally, we should test all.

test.describe.serial('System Messages', () => {
	let poHomeChannel: HomeChannel;
	let user: IUser;
	let group: IRoom;

	test.beforeAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'Hide_System_Messages', [])).status()).toBe(200);

		const groupResult = await api.post('/groups.create', { name: faker.string.uuid() });
		await expect(groupResult.status()).toBe(200);

		group = (await groupResult.json()).group;

		const result = await api.post('/users.create', userData);
		expect(result.status()).toBe(200);

		user = (await result.json()).user;
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');

		if (!group?.name) {
			return;
		}

		await poHomeChannel.sidenav.openChat(group.name);
	});

	test.afterAll(async ({ api }) => {
		await expect((await api.post('/groups.delete', { roomId: group._id })).status()).toBe(200);
	});

	test('expect "User added" system message to be visible', async ({ page, api }) => {
		await expect((await api.post('/groups.invite', { roomId: group._id, userId: user._id })).status()).toBe(200);

		await expect(findSysMes(page, 'au')).toBeVisible();
	});

	test('expect "User added" system message to be hidden', async ({ page, api }) => {
		await expect((await setSettingValueById(api, 'Hide_System_Messages', ['au'])).status()).toBe(200);

		await expect(findSysMes(page, 'au')).not.toBeVisible();
	});

	test('expect "User removed" system message to be visible', async ({ page, api }) => {
		await expect((await api.post('/groups.kick', { roomId: group._id, userId: user._id })).status()).toBe(200);

		await expect(findSysMes(page, 'ru')).toBeVisible();
	});

	test('expect "User removed" system message to be hidden', async ({ page, api }) => {
		await expect((await setSettingValueById(api, 'Hide_System_Messages', ['ru'])).status()).toBe(200);

		await expect(findSysMes(page, 'ru')).not.toBeVisible();
	});
});
