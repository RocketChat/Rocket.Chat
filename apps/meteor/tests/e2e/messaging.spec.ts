import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Messaging', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect show "hello word" in both contexts (targetChannel)', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const { page } = await createAuxContext(browser, Users.user2);
		const auxContext = { page, poHomeChannel: new HomeChannel(page) };

		await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage('hello world');

		await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');

		await auxContext.page.close();
	});

	test('expect show "hello word" in both contexts (direct)', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('user2');
		const { page } = await createAuxContext(browser, Users.user2);
		const auxContext = { page, poHomeChannel: new HomeChannel(page) };
		await auxContext.poHomeChannel.sidenav.openChat('user1');

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');

		await auxContext.page.close();
	});
});
