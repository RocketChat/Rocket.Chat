import { expect, test } from './utils/test';
import { HomeChannel, AcrossPage } from './page-objects';
import { installTestApp, cleanupTesterApp } from './utils';

test.use({ storageState: 'user1-session.json' });

test.describe.parallel('Apps', () => {
	let poHomeChannel: HomeChannel;
	let acrossPage: AcrossPage;

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Apps_Framework_enabled', { value: true });
		await api.post('/settings/Apps_Framework_Development_Mode', { value: true });
		await installTestApp(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		acrossPage = new AcrossPage(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat('general');
	});

	test('expect allow user open app contextualbar', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await expect(acrossPage.btnVerticalBarClose).toBeVisible();
	});

	test('expect app contextualbar to be closed', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await acrossPage.btnVerticalBarClose.click();
		await expect(acrossPage.btnVerticalBarClose).toBeHidden();
	});

	test.afterAll(async ({ api }) => {
		await cleanupTesterApp(api);
		await api.post('/settings/Apps_Framework_enabled', { value: false });
		await api.post('/settings/Apps_Framework_Development_Mode', { value: false });
	});
});
