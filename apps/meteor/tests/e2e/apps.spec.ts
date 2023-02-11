import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';

test.use({ storageState: 'user1-session.json' });

test.describe.serial('Apps', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat('general');
	});

	test('expect allow user open app contextualbar', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await expect(poHomeChannel.btnVerticalBarClose).toBeVisible();
	});

	test('expect app contextualbar to be closed', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await poHomeChannel.btnVerticalBarClose.click();
		await expect(poHomeChannel.btnVerticalBarClose).toBeHidden();
	});
});
