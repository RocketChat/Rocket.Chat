import { faker } from '@faker-js/faker';

import { BASE_API_URL } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('e2e encryption - legacy format support', () => {
	test.use({ storageState: Users.userE2EE.state });

	let poHomeChannel: HomeChannel;
	const createdChannels: string[] = [];

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(
			createdChannels.map(async (channelName) => {
				await api.post('/groups.delete', { roomName: channelName });
			}),
		);

		await api.post('/settings/E2E_Enable', { value: false });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	//  ->>>>>>>>>>>Not testing upload since it was not implemented in the legacy format
	test('expect create a private channel encrypted and send an encrypted message', async ({ page, request }) => {
		await page.goto('/home');

		const channelName = faker.string.uuid();
		createdChannels.push(channelName);

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		const rid = await page.locator('[data-qa-rc-room]').getAttribute('data-qa-rc-room');

		// send old format encrypted message via API
		const msg = await page.evaluate(async (rid) => {
			// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires, import/no-absolute-path
			const { e2e } = require('/app/e2e/client/rocketchat.e2e.ts');
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
