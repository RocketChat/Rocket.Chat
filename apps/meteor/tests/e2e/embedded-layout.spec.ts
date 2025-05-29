import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createDirectMessage, createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

const embeddedLayoutURL = (pageUrl: string) => `${pageUrl}?layout=embedded`;
test.use({ storageState: Users.user1.state });

test.describe.serial('embedded-layout', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let notMemberChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		notMemberChannel = await createTargetChannel(api, { members: ['user2'] });
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
		await deleteChannel(api, notMemberChannel);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test('should hide room header toolbar in embedded layout', async ({ page }) => {
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
		await expect(poHomeChannel.roomHeaderToolbar).toBeVisible();
		await page.goto(embeddedLayoutURL(page.url()));
		await expect(poHomeChannel.roomHeaderToolbar).not.toBeVisible();
	});

	test.describe('channel non-member', () => {
		test('should show join button', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(notMemberChannel);
			await page.goto(embeddedLayoutURL(page.url()));
			await expect(poHomeChannel.composer).toBeDisabled();
			await expect(poHomeChannel.btnJoinRoom).toBeVisible();
		});

		test('should allow joining channel', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(notMemberChannel);
			await page.goto(embeddedLayoutURL(page.url()));
			await poHomeChannel.btnJoinRoom.click();
			await expect(poHomeChannel.btnJoinRoom).not.toBeVisible();
			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();
			await poHomeChannel.content.sendMessage('Hello');
			await expect(poHomeChannel.content.lastUserMessage).toContainText('Hello');
		});
	});

	test.describe('channel member', () => {
		test('should hide join button', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(targetChannel);
			await page.goto(embeddedLayoutURL(page.url()));
			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();
			await expect(poHomeChannel.btnJoinRoom).not.toBeVisible();
		});

		test('should allow sending messages', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(targetChannel);
			await page.goto(embeddedLayoutURL(page.url()));
			await poHomeChannel.content.sendMessage('Hello');
			await expect(poHomeChannel.content.lastUserMessage).toContainText('Hello');
		});
	});

	test.describe('direct message', () => {
		test('should allow sending messages', async ({ page, api }) => {
			await createDirectMessage(api);
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(Users.user2.data.username);
			await page.goto(embeddedLayoutURL(page.url()));

			await expect(poHomeChannel.composer).toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();
			await expect(poHomeChannel.btnJoinRoom).not.toBeVisible();

			await poHomeChannel.content.sendMessage('Hello from embedded DM');
			await expect(poHomeChannel.content.lastUserMessage).toContainText('Hello from embedded DM');
		});
	});
});
