import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelMonitors } from '../page-objects';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.skip(!IS_EE, 'OC - Manage Monitors > Enterprise Only');

test.describe.serial('OC - Manage Monitors', () => {
	let poMonitors: OmnichannelMonitors;

	test.beforeAll(async ({ api }) => {
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/agent', { username: 'user2' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
		]);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/manager/user1'),
			api.delete('/livechat/users/agent/user2'),
			api.delete('/livechat/users/manager/user2'),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poMonitors = new OmnichannelMonitors(page);

		await page.goto('/omnichannel');
		await page.locator('.main-content').waitFor();
		await poMonitors.sidenav.linkMonitors.click();
	});

	test('OC - Manager Monitors - Add monitor', async () => {
		await test.step('expect to add agent as monitor', async () => {
			await expect(poMonitors.findRowByName('user1')).not.toBeVisible();
			await poMonitors.selectMonitor('user1');
			await poMonitors.btnAddMonitor.click();
			await expect(poMonitors.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect to remove agent from monitor', async () => {
			await poMonitors.btnRemoveByName('user1').click();
			await expect(poMonitors.modalConfirmRemove).toBeVisible();
			await poMonitors.btnConfirmRemove.click();
			await expect(poMonitors.findRowByName('user1')).not.toBeVisible();
		});
	});

	test('OC - Manager Monitors - Search', async () => {
		await test.step('expect to add 2 monitors', async () => {
			await poMonitors.selectMonitor('user1');
			await poMonitors.btnAddMonitor.click();

			await expect(poMonitors.findRowByName('user1')).toBeVisible();

			await poMonitors.selectMonitor('user2');
			await poMonitors.btnAddMonitor.click();

			await expect(poMonitors.findRowByName('user2')).toBeVisible();
		});

		await test.step('expect to search monitor', async () => {
			await expect(poMonitors.findRowByName('user1')).toBeVisible();
			await expect(poMonitors.findRowByName('user2')).toBeVisible();

			await poMonitors.inputSearch.fill('user1');
			await expect(poMonitors.findRowByName('user1')).toBeVisible();
			await expect(poMonitors.findRowByName('user2')).not.toBeVisible();

			await poMonitors.inputSearch.fill('user2');
			await expect(poMonitors.findRowByName('user1')).not.toBeVisible();
			await expect(poMonitors.findRowByName('user2')).toBeVisible();

			await poMonitors.inputSearch.fill('');
			await expect(poMonitors.findRowByName('user1')).toBeVisible();
			await expect(poMonitors.findRowByName('user2')).toBeVisible();
		});

		await test.step('expect to remove monitors', async () => {
			await poMonitors.btnRemoveByName('user1').click();
			await expect(poMonitors.modalConfirmRemove).toBeVisible();
			await poMonitors.btnConfirmRemove.click();

			await expect(poMonitors.findRowByName('user1')).not.toBeVisible();

			await poMonitors.btnRemoveByName('user2').click();
			await expect(poMonitors.modalConfirmRemove).toBeVisible();
			await poMonitors.btnConfirmRemove.click();

			await expect(poMonitors.findRowByName('user2')).not.toBeVisible();
		});
	});
});
