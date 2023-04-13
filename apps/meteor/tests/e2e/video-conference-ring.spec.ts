import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference ringing', () => {
	let poHomeChannel: HomeChannel;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect is ringing in direct', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('user2');
		const { page } = await createAuxContext(browser, Users.user2);
		const auxContext = { page, poHomeChannel: new HomeChannel(page) };

		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();

		await expect(poHomeChannel.content.ringCallText('Calling')).toBeVisible();
		await expect(auxContext.poHomeChannel.content.ringCallText('Incoming call from')).toBeVisible();

		await auxContext.poHomeChannel.content.btnDeclineCall.click();

		await auxContext.page.close();
	});
});
