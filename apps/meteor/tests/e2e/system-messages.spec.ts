import type { IRoom } from '@rocket.chat/core-typings';
import type { Locator, Page } from '@playwright/test';
import faker from '@faker-js/faker';

import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';

test.use({ storageState: 'admin-session.json' });

// const userData = {
// 	username: faker.datatype.uuid(),
// 	name: faker.name.firstName(),
// 	email: faker.internet.email(),
// 	password: faker.internet.password(),
// };

const findSysMes = (page: Page, id: string): Locator => {
	return page.locator(`[data-qa="system-message"][data-system-message-type="${id}"]`);
};

// There currently are over 33 system messages. Testing only a couple due to test being too slow right now.
// Ideally, we should test all.
test.describe.serial('System Messages', () => {
	let poHomeChannel: HomeChannel;
	const user = { _id: 'user1' };
	let group: IRoom;

	const openGroup = async () => {
		if (!group?.name) {
			return;
		}
		await poHomeChannel.sidenav.openChat(group.name);
	};

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', [])).status()).toBe(200);

		const groupResult = await api.post('/groups.create', { name: faker.datatype.uuid() });
		expect(groupResult.status()).toBe(200);

		group = (await groupResult.json()).group;

		// const result = await api.post('/users.create', userData);
		// expect(result.status()).toBe(200);

		// user = (await result.json()).user;
	});

	test.beforeEach(async ({ page }) => {
		// TODO debug - remove this
		console.log('state ->', JSON.stringify(await page.context().storageState()));

		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/groups.delete', { roomId: group._id })).status()).toBe(200);
	});

	test('expect "User added" system message to be visible', async ({ page, api }) => {
		expect((await api.post('/groups.invite', { roomId: group._id, userId: user._id })).status()).toBe(200);

		await openGroup();

		await expect(findSysMes(page, 'au')).toBeVisible();
	});

	test('expect "User added" system message to be hidden', async ({ page, api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', ['au'])).status()).toBe(200);

		await openGroup();

		await expect(findSysMes(page, 'au')).not.toBeVisible();
	});

	test('expect "User removed" system message to be visible', async ({ page, api }) => {
		expect((await api.post('/groups.kick', { roomId: group._id, userId: user._id })).status()).toBe(200);

		await openGroup();

		await expect(findSysMes(page, 'ru')).toBeVisible();
	});

	test('expect "User removed" system message to be hidden', async ({ page, api }) => {
		expect((await setSettingValueById(api, 'Hide_System_Messages', ['ru'])).status()).toBe(200);

		await openGroup();

		await expect(findSysMes(page, 'ru')).not.toBeVisible();
	});
});
