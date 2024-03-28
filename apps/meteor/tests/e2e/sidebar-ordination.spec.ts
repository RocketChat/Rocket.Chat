import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('sidebar', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect to sort the sidebar by Name', async () => {
		await poHomeChannel.sidenav.openDisplayOptions();
		await poHomeChannel.sidenav.selectOrderByName();

		const channels = await poHomeChannel.sidenav.getChannels();
		expect(channels, 'Channels are not sorted by name').toEqual([...channels].sort((a, b) => a.localeCompare(b)));
	});
});
