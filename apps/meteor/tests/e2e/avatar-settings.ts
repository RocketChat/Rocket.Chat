import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetPrivateChannel, createDirectMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const testAvatars = (homeChannel: HomeChannel, channel: string, url: string) => {
	test('expect sidebar avatar to have provider prefix', async () => {
		expect(homeChannel.sidenav.getSidebarItemByName(channel).locator('img').getAttribute('src')).toBe(url);
	});

	test('expect channel header avatar to have provider prefix', async () => {
		await homeChannel.sidenav.openChat(channel);
		expect(homeChannel.content.channelHeader.locator('img').getAttribute('src')).toBe(url);
	});

	test('expect channel info avatar to have provider prefix', async () => {
		await homeChannel.sidenav.openChat(channel);
		expect(homeChannel.content.channelHeader.locator('img').getAttribute('src')).toBe(url);
	});
};

test.describe('avatar-settings', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.describe('external avatar provider', () => {
		const providerUrlPrefix = 'https://example.com/avatar/';

		test.beforeAll(async ({ updateSetting }) => {
			await Promise.all([
				updateSetting('Accounts_RoomAvatarExternalUrl', `${providerUrlPrefix}{username}`, ''),
				updateSetting('Accounts_AvatarExternalUrl', `${providerUrlPrefix}{username}`, ''),
			]);
		});

		test.afterAll(async ({ restoreSettings }) => {
			await restoreSettings();
		});

		test.describe('public channels', () => {
			let channelName = '';
			let avatarUrl = '';

			test.beforeAll(async ({ api }) => {
				channelName = await createTargetChannel(api);
				avatarUrl = `${providerUrlPrefix}${channelName}`;
			});

			testAvatars(poHomeChannel, channelName, avatarUrl);
		});

		test.describe('private channels', () => {
			let channelName = '';
			let avatarUrl = '';

			test.beforeAll(async ({ api }) => {
				channelName = await createTargetPrivateChannel(api);
				avatarUrl = `${providerUrlPrefix}${channelName}`;
			});

			testAvatars(poHomeChannel, channelName, avatarUrl);
		});

		test.describe('direct messages', () => {
			const channelName = Users.user2.data.username;
			const avatarUrl = `${providerUrlPrefix}${channelName}`;

			test.beforeAll(async ({ api }) => {
				await createDirectMessage(api);

				// send a message as user 2
				test.use({ storageState: Users.user2.state });
				await poHomeChannel.sidenav.openChat(Users.user1.data.username);
				await poHomeChannel.content.sendMessage('hello world');

				test.use({ storageState: Users.user1.state });
			});

			testAvatars(poHomeChannel, channelName, avatarUrl);

			test('expect message avatar to have provider prefix', async () => {
				expect(poHomeChannel.content.lastUserMessage.locator('img').getAttribute('src')).toBe(avatarUrl);
			});

			test('expect user card avatar to have provider prefix', async () => {
				await poHomeChannel.content.lastUserMessage.locator('.rcx-message-header__name-container').click();
				expect(poHomeChannel.content.userCard.locator('img').getAttribute('src')).toBe(avatarUrl);
			});
		});
	});
});
