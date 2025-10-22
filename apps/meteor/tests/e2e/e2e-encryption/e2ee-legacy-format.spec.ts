import { faker } from '@faker-js/faker';
import type { APIRequestContext, Page } from '@playwright/test';

import { BASE_API_URL } from '../config/constants';
import injectInitialData from '../fixtures/inject-initial-data';
import { Users, restoreState } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

const encryptLegacyMessage = async (page: Page, rid: string, messageText: string) => {
	return page.evaluate(
		async ({ rid, msg }: { rid: string; msg: string }) => {
			// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires, import/no-absolute-path
			const { e2e } = require('/client/lib/e2ee/rocketchat.e2e.ts');
			const e2eRoom = await e2e.getInstanceByRoomId(rid);
			return e2eRoom.encrypt({ _id: 'id', msg });
		},
		{ rid, msg: messageText },
	);
};

const sendEncryptedMessage = async (request: APIRequestContext, rid: string, encryptedMsg: string) => {
	return request.post(`${BASE_API_URL}/chat.sendMessage`, {
		headers: {
			'X-Auth-Token': Users.userE2EE.data.loginToken,
			'X-User-Id': Users.userE2EE.data._id,
		},
		data: {
			message: {
				rid,
				msg: encryptedMsg,
				t: 'e2e',
			},
		},
	});
};

test.describe('E2EE Legacy Format', () => {
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
		await page.goto('/home');
	});

	test('legacy expect create a private channel encrypted and send an encrypted message', async ({ page, request }) => {
		const channelName = faker.string.uuid();

		await injectInitialData();
		await restoreState(page, Users.userE2EE, { except: ['private_key', 'public_key', 'e2e.randomPassword'] });

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(page.getByTitle('Encrypted')).toBeVisible();
		// TODO: Fix this flakiness
		await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();

		const rid = (await page.locator('[data-qa-rc-room]').getAttribute('data-qa-rc-room')) || '';
		expect(rid).toBeTruthy();

		const encryptedMessage = await encryptLegacyMessage(page, rid, 'Old format message');

		await sendEncryptedMessage(request, rid, encryptedMessage);

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('Old format message');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});
});
