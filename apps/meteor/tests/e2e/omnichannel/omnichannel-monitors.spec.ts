import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelMonitors } from '../page-objects/omnichannel';
import { createMonitor } from '../utils/omnichannel/monitors';
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
		await poMonitors.goto();
	});

	test('OC - Manager Monitors - Add monitor', async () => {
		await test.step('expect to add agent as monitor', async () => {
			await expect(poMonitors.table.findRowByName('user1')).not.toBeVisible();
			await poMonitors.addMonitor('user1');
			await expect(poMonitors.table.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect to remove agent from monitor', async () => {
			await poMonitors.removeMonitor('user1');
			await expect(poMonitors.table.findRowByName('user1')).not.toBeVisible();
		});
	});

	test.describe('Search', () => {
		let monitors: Awaited<ReturnType<typeof createMonitor>>[];

		test.beforeAll(async ({ api }) => {
			monitors = await Promise.all([createMonitor(api, 'user1'), createMonitor(api, 'user2')]);
		});

		test.afterAll(async () => {
			await Promise.all(monitors.map((monitor) => monitor.delete()));
		});

		test('OC - Manager Monitors - Search', async () => {
			await test.step('expect to search monitor', async () => {
				await expect(poMonitors.table.findRowByName('user1')).toBeVisible();
				await expect(poMonitors.table.findRowByName('user2')).toBeVisible();

				await poMonitors.inputSearch.fill('user1');
				await expect(poMonitors.table.findRowByName('user1')).toBeVisible();
				await expect(poMonitors.table.findRowByName('user2')).not.toBeVisible();

				await poMonitors.inputSearch.fill('user2');
				await expect(poMonitors.table.findRowByName('user1')).not.toBeVisible();
				await expect(poMonitors.table.findRowByName('user2')).toBeVisible();

				await poMonitors.inputSearch.fill('');
				await expect(poMonitors.table.findRowByName('user1')).toBeVisible();
				await expect(poMonitors.table.findRowByName('user2')).toBeVisible();
			});
		});
	});
});
