import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';

const APP_TESTER = {
	id: '',
	url: 'https://github.com/RocketChat/Apps.RocketChat.Tester/blob/master/dist/appsrocketchattester_0.0.5.zip?raw=true',
};

test.use({ storageState: 'user1-session.json' });

test.describe.parallel('Apps', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Apps_Framework_enabled', { value: true });
		await api.post('/settings/Apps_Framework_Development_Mode', { value: true });

		const { app } = await (await api.post('/api/apps', { url: APP_TESTER.url }, '')).json();
		APP_TESTER.id = app.id;
	});

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

	test.afterAll(async ({ api }) => {
		await api.delete(`/api/apps/${APP_TESTER.id}`);
		await api.post('/settings/Apps_Framework_enabled', { value: false });
		await api.post('/settings/Apps_Framework_Development_Mode', { value: false });
	});
});
