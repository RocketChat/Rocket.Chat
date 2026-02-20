import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';

import { BASE_API_URL } from '../config/constants';
import { Users } from '../fixtures/userStates';
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

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(page.getByTitle('Encrypted')).toBeVisible();
		// TODO: Fix this flakiness
		await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();

		const rid = (await page.locator('[data-qa-rc-room]').getAttribute('data-qa-rc-room')) || '';
		expect(rid).toBeTruthy();

		const kid = '32c9e7917b78';
		const encryptedKey =
			'ibtLAKG9zcQ/NTp+86nVelUjewPbPNW+EC+eagVPVVlbxvWNXkgltrBQB4gDao1Fp6fHUibQB3dirJ4rzy7CViww0o4QjAwPPQMIxZ9DLJhjKnu6bkkOp6Z0/a9g/8Wf/cvP9/bp7tUt7Et4XMmJwIe5iyJZ35lsyduLc8V+YyK8sJiGf4BRagJoBr8xEBgqBWqg6Vwn3qtbbiTs65PqErbaUmSM3Hn6tfkcS6ukLG/DbptW1B9U66IX3fQesj50zWZiJyvxOoxDeHRH9UEStyv9SP8nrFjEKM3TDiakBeDxja6LoN8l3CjP9K/5eg25YqANZAQjlwaCaeTTHndTgQ==';
		const encryptedMessage =
			'3JpM8aOVludqIRzx+DOqjEU9Mj3NUWb+/GLRl7sdkvTtCMChH1LBjMjJJvVJ6Rlw4dI8BYFftZWiCOiR7TPwriCoSPiZ7dY5C4H2q8MVSdR95ZiyG7eWQ5j5/rxzAYsSWDA9LkumW8JBb+WQ1hD9JMfQd4IXtlFMnaDgEhZhe/s=';

		await page.evaluate(
			async ({ rid, kid, encryptedKey }) => {
				// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires, import/no-absolute-path, @typescript-eslint/consistent-type-imports
				const { e2e } = require('/client/lib/e2ee/rocketchat.e2e.ts') as typeof import('../../../client/lib/e2ee/rocketchat.e2e');
				const room = await e2e.getInstanceByRoomId(rid);
				await room?.importGroupKey(kid + encryptedKey);
			},
			{ rid, kid, encryptedKey },
		);

		await sendEncryptedMessage(request, rid, kid + encryptedMessage);

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});
});
