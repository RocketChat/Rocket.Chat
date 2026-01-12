import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createDirectMessage, createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

const embeddedLayoutURL = (pageUrl: string) => `${pageUrl}?layout=embedded`;

test.use({ storageState: Users.user1.state });

test.describe('embedded-layout', () => {
	let poHomeChannel: HomeChannel;
	let targetChannelId: string;
	let notMemberChannelId: string;
	let joinChannelId: string;

	test.beforeAll(async ({ api }) => {
		[targetChannelId, notMemberChannelId, joinChannelId] = await Promise.all([
			createTargetChannel(api, { members: ['user1'] }),
			createTargetChannel(api, { members: ['user2'] }),
			createTargetChannel(api, { members: ['user2'] }),
		]);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteChannel(api, targetChannelId), deleteChannel(api, notMemberChannelId), deleteChannel(api, joinChannelId)]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.describe('Layout elements visibility', () => {
		test('should hide primary navigation elements in embedded layout', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(targetChannelId);
			await expect(poHomeChannel.roomHeaderToolbar).toBeVisible();

			await page.goto(embeddedLayoutURL(page.url()));
			await expect(poHomeChannel.roomHeaderToolbar).not.toBeVisible();
			await poHomeChannel.sidebar.waitForDismissal();
		});

		test.describe('should show room header toolbar when show top navbar setting is enabled', () => {
			test.beforeAll(async ({ api }) => {
				await api.post('/settings/UI_Show_top_navbar_embedded_layout', { value: true });
			});

			test.afterAll(async ({ api }) => {
				await api.post('/settings/UI_Show_top_navbar_embedded_layout', { value: false });
			});

			test('should show room header toolbar as top navbar when setting enabled', async ({ page }) => {
				await page.goto('/home');
				await poHomeChannel.navbar.openChat(targetChannelId);
				await page.goto(embeddedLayoutURL(page.url()));

				await expect(poHomeChannel.roomHeaderToolbar).toBeVisible();
			});
		});
	});

	test.describe('Channel member functionality', () => {
		test('should hide join button and enable messaging for members', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(targetChannelId);
			await page.goto(embeddedLayoutURL(page.url()));

			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();
			await expect(poHomeChannel.btnJoinRoom).not.toBeVisible();
		});

		test('should allow sending and receiving messages', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(targetChannelId);
			await page.goto(embeddedLayoutURL(page.url()));

			const testMessage = `Embedded test message ${Date.now()}`;
			await poHomeChannel.content.sendMessage(testMessage);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(testMessage);
		});

		test('should preserve message composer functionality', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(targetChannelId);
			await page.goto(embeddedLayoutURL(page.url()));

			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composerToolbar).toBeVisible();

			await poHomeChannel.composer.fill('Test message');
			await expect(poHomeChannel.composer).toHaveValue('Test message');

			await poHomeChannel.composer.fill('');
			await expect(poHomeChannel.composer).toHaveValue('');
		});
	});

	test.describe('Channel non-member functionality', () => {
		test('should display join button and disable composer for non-members', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(notMemberChannelId);
			await page.goto(embeddedLayoutURL(page.url()));

			await expect(poHomeChannel.composer).toBeDisabled();
			await expect(poHomeChannel.btnJoinRoom).toBeVisible();
		});

		test('should allow joining channel and enable messaging', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(joinChannelId);
			await page.goto(embeddedLayoutURL(page.url()));

			await poHomeChannel.btnJoinRoom.click();

			await expect(poHomeChannel.btnJoinRoom).not.toBeVisible();
			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();

			const joinMessage = `Joined and sent message ${Date.now()}`;
			await poHomeChannel.content.sendMessage(joinMessage);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(joinMessage);
		});
	});

	test.describe('Direct message functionality', () => {
		test('should allow sending direct messages', async ({ page, api }) => {
			await createDirectMessage(api);
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(Users.user2.data.username);
			await page.goto(embeddedLayoutURL(page.url()));

			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();
			await expect(poHomeChannel.btnJoinRoom).not.toBeVisible();

			const dmMessage = `Embedded DM test ${Date.now()}`;
			await poHomeChannel.content.sendMessage(dmMessage);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(dmMessage);
		});
	});
});
