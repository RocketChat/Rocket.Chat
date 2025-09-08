import { faker } from '@faker-js/faker';

import { BASE_API_URL } from '../config/constants';
import injectInitialData from '../fixtures/inject-initial-data';
import { Users, restoreState } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { getSettingValueById } from '../utils';
import { test, expect } from '../utils/test';

const settings = {
	E2E_Enable: false as unknown,
	E2E_Allow_Unencrypted_Messages: false as unknown,
	E2E_Enabled_Default_DirectRooms: false as unknown,
	E2E_Enabled_Default_PrivateRooms: false as unknown,
};

test.beforeAll(async ({ api }) => {
	settings.E2E_Enable = await getSettingValueById(api, 'E2E_Enable');
	settings.E2E_Allow_Unencrypted_Messages = await getSettingValueById(api, 'E2E_Allow_Unencrypted_Messages');
	settings.E2E_Enabled_Default_DirectRooms = await getSettingValueById(api, 'E2E_Enabled_Default_DirectRooms');
	settings.E2E_Enabled_Default_PrivateRooms = await getSettingValueById(api, 'E2E_Enabled_Default_PrivateRooms');
});

test.afterAll(async ({ api }) => {
	await api.post('/settings/E2E_Enable', { value: settings.E2E_Enable });
	await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: settings.E2E_Allow_Unencrypted_Messages });
	await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: settings.E2E_Enabled_Default_DirectRooms });
	await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: settings.E2E_Enabled_Default_PrivateRooms });
});

test.describe('E2EE Legacy Format', () => {
	let poHomeChannel: HomeChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { roomId: `user2${Users.userE2EE.data.username}` });
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

		const rid = await page.locator('[data-qa-rc-room]').getAttribute('data-qa-rc-room');

		// send old format encrypted message via API
		const msg = await page.evaluate(async (rid) => {
			// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires, import/no-absolute-path
			const { e2e } = require('/client/lib/e2ee/rocketchat.e2e.ts');
			const e2eRoom = await e2e.getInstanceByRoomId(rid);
			return e2eRoom.encrypt({ _id: 'id', msg: 'Old format message' });
		}, rid);

		await request.post(`${BASE_API_URL}/chat.sendMessage`, {
			headers: {
				'X-Auth-Token': Users.userE2EE.data.loginToken,
				'X-User-Id': Users.userE2EE.data._id,
			},
			data: {
				message: {
					rid,
					msg,
					t: 'e2e',
				},
			},
		});

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('Old format message');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});
});
