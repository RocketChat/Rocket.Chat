import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('read-receipts', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Message_Read_Receipt_Enabled', true);
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should show read receipts message sent status in the sent message', async ({ browser }) => {
		const { page } = await createAuxContext(browser, Users.user1);
		const auxContext = { page, poHomeChannel: new HomeChannel(page) };
		await auxContext.poHomeChannel.sidenav.openChat(targetChannel);
		await auxContext.poHomeChannel.content.sendMessage('hello admin');

		await expect(auxContext.poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message sent' })).toBeVisible();
		await auxContext.page.close();
	});

  test('should show read receipts message viewed status in the sent message', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await expect(poHomeChannel.content.lastUserMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();		
	});

	test('should show the reads receipt modal with the users who read the message', async ({ page, api }) => {
		await setSettingValueById(api, 'Message_Read_Receipt_Store_Users', true);

		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Read receipts"]').click();

		await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(2);
	});
});
