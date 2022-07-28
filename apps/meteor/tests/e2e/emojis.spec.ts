import { test, expect } from '@playwright/test';

import { HomeChannel } from './page-objects';

test.use({ storageState: 'session-admin.json' });

test.describe.serial('emoji', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

        await page.goto('/')
	});

    test('expect pick and send grinning emoji', async ({ page }) => {
		await poHomeChannel.sidenav.openChat('general');
        await poHomeChannel.content.pickEmoji('emoji-grinning')
        await page.keyboard.press('Enter');

        await expect(poHomeChannel.content.lastUserMessage).toContainText('😀');
    });

    test('expect render special characters and numbers properly', async () => {
		await poHomeChannel.sidenav.openChat('general');

        await poHomeChannel.content.sendMessage('® © ™ # *');
        await expect(poHomeChannel.content.lastUserMessage).toContainText('® © ™ # *');

        await poHomeChannel.content.sendMessage('0 1 2 3 4 5 6 7 8 9');
        await expect(poHomeChannel.content.lastUserMessage).toContainText('0 1 2 3 4 5 6 7 8 9');
    });
});
