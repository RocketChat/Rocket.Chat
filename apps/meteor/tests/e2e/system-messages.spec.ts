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
	let poHomeChannel: HomeChannel;
	let group: IRoom;
	let user: IUser;

	const findSysMes = (page: Page, id: string): Locator => {
		return page.locator(`[data-qa="system-message"][data-system-message-type="${id}"]`);
	};

	test.beforeAll(async ({ api }) => {
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
	});

	test.beforeEach(async ({ page }) => {
		if (!group.name) {
			return;
		}

		// TODO debug - remove this
		console.log('state ->', JSON.stringify(await page.context().storageState()));

		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(group.name);
	});

	test('expect "User added" system message to be visible', async ({ page, api }) => {
		expect((await api.post('/groups.invite', { roomId: group._id, userId: user._id })).status()).toBe(200);
		await expect(findSysMes(page, 'au')).toBeVisible();
	});

	test('expect "User added" system message to be hidden', async ({ page, api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', ['au'])).status()).toBe(200);
		await expect(findSysMes(page, 'au')).not.toBeVisible();
	});

	test('expect "User removed" system message to be visible', async ({ page, api }) => {
		expect((await api.post('/groups.kick', { roomId: group._id, userId: user._id })).status()).toBe(200);
		await expect(findSysMes(page, 'ru')).toBeVisible();
	});

	test('expect "User removed" system message to be hidden', async ({ page, api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', ['ru'])).status()).toBe(200);
		await expect(findSysMes(page, 'ru')).not.toBeVisible();
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/groups.delete', { roomId: group._id })).status()).toBe(200);
	});
});
