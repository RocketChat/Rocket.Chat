import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable'];

preserveSettings(settingsList);

test.describe('E2EE Mentions', () => {
	const createdChannels: string[] = [];
	let poHomeChannel: HomeChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map((channelName) => api.post('/groups.delete', { roomName: channelName })));
	});

	test('expect create an encrypted private channel and mention user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			createdChannels.push(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('mention user', async () => {
			await poHomeChannel.content.sendMessage('hello @user1');
			await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
		});
	});

	test('expect create an encrypted private channel, mention a channel and navigate to it', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			createdChannels.push(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('mention channel', async () => {
			await poHomeChannel.content.sendMessage('Are you in the #general channel?');
			await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();
		});

		await test.step('navigate to channel', async () => {
			await poHomeChannel.content.getChannelMention('general').click();
			await expect(page).toHaveURL(`/channel/general`);
		});
	});

	test('expect create an encrypted private channel, mention a channel and user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			createdChannels.push(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('mention channel and user', async () => {
			await poHomeChannel.content.sendMessage('Are you in the #general channel, @user1 ?');
			await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
			await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();
		});
	});
});
