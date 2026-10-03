import { faker } from '@faker-js/faker';
import type { APIRequestContext, Page } from '@playwright/test';
import type { IRoom } from '@rocket.chat/core-typings';

import { BASE_API_URL, DEFAULT_USER_CREDENTIALS, IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { deletePrivateRoomsByName } from '../utils';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

const createEncryptedGroupAsE2EEUser = async (request: APIRequestContext, createdChannels: string[]): Promise<IRoom> => {
	const name = faker.string.uuid();
	const response = await request.post(`${BASE_API_URL}/groups.create`, {
		headers: { 'X-Auth-Token': Users.userE2EE.data.loginToken, 'X-User-Id': Users.userE2EE.data._id },
		data: { name, extraData: { encrypted: true } },
	});
	expect(response.status()).toBe(200);
	createdChannels.push(name);
	return (await response.json()).group;
};

const waitForRoomKeyReady = async (page: Page, rid: string) => {
	await expect
		.poll(
			() =>
				page.evaluate(async (rid) => {
					// eslint-disable-next-line import-x/no-absolute-path
					const { e2e } = require('/client/lib/e2ee/rocketchat.e2e.ts') as typeof import('../../../client/lib/e2ee/rocketchat.e2e');
					const room = await e2e.getInstanceByRoomId(rid);
					return room?.getState();
				}, rid),
			{ message: 'expect room encryption key to be ready before sending messages' },
		)
		.toBe('READY');
};

test.describe('E2EE Server Settings', () => {
	const createdChannels: string[] = [];
	let poHomeChannel: HomeChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { username: 'user2' });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.afterAll(async () => {
		await deletePrivateRoomsByName(
			{ username: Users.userE2EE.data.username, password: DEFAULT_USER_CREDENTIALS.password },
			createdChannels,
		);
	});

	test('expect slash commands to be enabled in an e2ee room', async ({ page, request }) => {
		test.skip(!IS_EE, 'Premium Only');
		const group = await createEncryptedGroupAsE2EEUser(request, createdChannels);

		await poHomeChannel.gotoGroup(group.name as string);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		await waitForRoomKeyReady(page, group._id);

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[name="msg"]').type('/');
		await expect(page.locator('#popup-item-contextualbar')).not.toHaveClass(/disabled/);
		await page.locator('[name="msg"]').clear();

		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await expect(poHomeChannel.btnContextualbarClose).toBeVisible();

		await poHomeChannel.btnContextualbarClose.click();
		await expect(poHomeChannel.btnContextualbarClose).toBeHidden();
	});

	test.describe('un-encrypted messages not allowed in e2ee rooms', () => {
		test.skip(!IS_EE, 'Premium Only');
		let poHomeChannel: HomeChannel;

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
		});

		test.beforeAll(async ({ api }) => {
			await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		});

		test('expect slash commands to be disabled in an e2ee room', async ({ page, request }) => {
			const group = await createEncryptedGroupAsE2EEUser(request, createdChannels);

			await poHomeChannel.gotoGroup(group.name as string);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
			await waitForRoomKeyReady(page, group._id);

			await poHomeChannel.content.sendMessage('This is an encrypted message.');

			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

			await page.locator('[name="msg"]').pressSequentially('/');
			await expect(page.locator('#popup-item-contextualbar')).toHaveClass(/disabled/);
		});
	});
});
