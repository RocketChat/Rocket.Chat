import { appUiKitRoomTest } from '../../data/apps/app-packages';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { getAppLogs, installLocalTestPackage, uninstallApp } from '../utils/apps';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Apps > UIKit interactions data', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let appId: string;

	test.beforeAll(async () => {
		const result = await installLocalTestPackage(appUiKitRoomTest);
		appId = result.app.id;
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.navbar.openChat('general');
	});

	test.afterAll(async () => {
		await uninstallApp(appId);
	});

	/**
	 * Finds a log entry matching a handler method and a specific debug label.
	 * The app logs using `this.getLogger().debug(label, value)`, creating entries with args = [label, value].
	 * Each handler invocation creates a log group with `method` like `app:executeBlockActionHandler`.
	 */
	function findLogItem(
		logs: Awaited<ReturnType<typeof getAppLogs>>['logs'],
		methodFragment: string,
		[arg0, arg1]: [arg0: string, arg1?: string],
	) {
		return logs.find(
			(log) =>
				log.method.includes(methodFragment) && log.entries.some((entry) => arg0 === entry.args[0] && (!arg1 || arg1 === entry.args[1])),
		);
	}

	test('should include correct data in executeBlockActionHandler when triggered in a message', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Send a message with a button via the slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal message ${seed}`);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the message with the button to appear and click it
		await page.getByRole('button', { name: 'Click!' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		const blockActionLog = findLogItem(logsResult.logs, 'executeBlockActionHandler', ['block_action_value', seed]);
		expect(blockActionLog, 'Block action handler log not found for message').toBeTruthy();

		// Verify room is present (GENERAL room)
		const roomEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_room');
		expect(roomEntry?.args[1], 'Room id should be present for message block action').toBe('GENERAL');

		// Verify user is present
		const userEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_user');
		expect(userEntry?.args[1], 'User should be present for message block action').toBe('user1');

		// Verify triggerId is present
		const triggerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_triggerId');
		expect(triggerEntry?.args[1], 'TriggerId should be present').not.toBe('no-triggerId');

		// Verify actionId is correct
		const actionIdEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_actionId');
		expect(actionIdEntry?.args[1], 'ActionId should be msg-button').toBe('msg-button');

		// Verify container type
		const containerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_container');
		expect(containerEntry?.args[1], 'Container type should be message').toBe('message');
	});

	test('should include correct data in executeBlockActionHandler when triggered in a contextual bar surface', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Open a contextual bar via slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal ctx ${seed}`);

		// Opening a contextual bar via the Apps Engine causes a client-side URL navigation
		// (e.g. /channel/general/app/{viewId}). Wait for that navigation to complete before
		// using any locators, otherwise Playwright throws "Target page, context or browser
		// has been closed" while the navigation is still in progress.
		await page.waitForURL(/\/app\//);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the contextual bar to appear and click the button
		const surface = page.getByRole('dialog', { name: 'UIKit Room Test Contextual Bar' });
		await surface.getByRole('button', { name: 'Click!' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent block action log with ctx-button actionId
		const blockActionLog = findLogItem(logsResult.logs, 'executeBlockActionHandler', ['block_action_value', seed]);
		expect(blockActionLog, 'Block action handler log not found for contextual bar').toBeTruthy();

		// Verify room is present
		const roomEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_room');
		expect(roomEntry?.args[1], 'Room id should be present for contextual bar block action').toBe('GENERAL');

		// Verify user is present
		const userEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_user');
		expect(userEntry?.args[1], 'User should be present for contextual bar block action').toBe('user1');

		// Verify triggerId is present
		const triggerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_triggerId');
		expect(triggerEntry?.args[1], 'TriggerId should be present').not.toBe('no-triggerId');

		// Close the contextual bar
		await surface.getByRole('button', { name: 'Close' }).click();
	});

	test('should include correct data in executeBlockActionHandler when triggered in a modal surface', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Open a modal via slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal modal ${seed}`);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the modal to appear and click the button
		const surface = page.getByRole('dialog', { name: 'UIKit Room Test Modal' });
		await surface.getByRole('button', { name: 'Click!' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent block action log with modal-button actionId
		const blockActionLog = findLogItem(logsResult.logs, 'executeBlockActionHandler', ['block_action_value', seed]);
		expect(blockActionLog, 'Block action handler log not found for modal').toBeTruthy();

		// Verify user is present
		const userEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_user');
		expect(userEntry?.args[1], 'User should be present for modal block action').toBe('user1');

		// Verify container type is view (modal)
		const containerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_container');
		expect(containerEntry?.args[1], 'Container type should be view for modal').toBe('view');

		await test.step('room is intentionally absent for modal block actions (modals have no room context)', async () => {
			const roomEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_room');
			expect(roomEntry?.args[1], 'Room entry should not be present for modal block action').toBe('no-room');
		});

		// Close the modal for the next test
		await surface.getByRole('button', { name: 'Close' }).click();
	});

	test('should include correct data in executeViewSubmitHandler when triggered in a modal surface', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Open a modal via slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal modal ${seed}`);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the modal and submit it
		await page.getByLabel('UIKit Room Test Modal').getByRole('button', { name: 'Submit' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		const viewSubmitLog = findLogItem(logsResult.logs, 'executeViewSubmitHandler', ['view_submit_id', `modal-${seed}`]);
		expect(viewSubmitLog, 'View submit handler log not found for modal').toBeTruthy();

		// Verify user is present
		const userEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_user');
		expect(userEntry?.args[1], 'User should be present for modal view submit').toBe('user1');

		// Verify triggerId is present
		const triggerEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_triggerId');
		expect(triggerEntry?.args[1], 'TriggerId should be present').not.toBe('no-triggerId');
	});

	test('should include correct data in executeViewSubmitHandler when triggered in a contextual bar surface', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Open a contextual bar via slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal ctx ${seed}`);

		// Wait for the client-side navigation to the contextual bar URL to complete
		await page.waitForURL(/\/app\//);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the contextual bar and submit it
		await page.getByLabel('UIKit Room Test Contextual Bar').getByRole('button', { name: 'Submit' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent view submit log
		const viewSubmitLog = findLogItem(logsResult.logs, 'executeViewSubmitHandler', ['view_submit_id', `ctx-${seed}`]);
		expect(viewSubmitLog, 'View submit handler log not found for contextual bar').toBeTruthy();

		// Verify room is present
		const roomEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_room');
		expect(roomEntry?.args[1], 'Room id should be present for contextual bar view submit').toBe('GENERAL');

		// Verify user is present
		const userEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_user');
		expect(userEntry?.args[1], 'User should be present for contextual bar view submit').toBe('user1');
	});

	test('should include correct data in executeViewClosedHandler when triggered in a modal surface', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Open a modal via slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal modal ${seed}`);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the modal and close it (via X button, not submit)
		await page.getByLabel('UIKit Room Test Modal').getByRole('button', { name: 'Close' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		const viewClosedLog = findLogItem(logsResult.logs, 'executeViewClosedHandler', ['view_closed_id', `modal-${seed}`]);
		expect(viewClosedLog, 'View closed handler log not found for modal').toBeTruthy();

		// Verify user is present
		const userEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_user');
		expect(userEntry?.args[1], 'User should be present for modal view closed').toBe('user1');
	});

	test('should include correct data in executeViewClosedHandler when triggered in a contextual bar surface', async ({ api, page }) => {
		const seed = Date.now().toString();

		// Open a contextual bar via slash command
		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-room-test-modal ctx ${seed}`);

		// Wait for the client-side navigation to the contextual bar URL to complete
		await page.waitForURL(/\/app\//);

		const interactionRequest = page.waitForRequest('**/ui.interaction/*');

		// Wait for the contextual bar to appear and close it
		await page.getByLabel('UIKit Room Test Contextual Bar').getByRole('button', { name: 'Close' }).click();

		await interactionRequest;

		// Fetch app logs and validate
		const logsResult = await getAppLogs(api, appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent view closed log
		const viewClosedLog = findLogItem(logsResult.logs, 'executeViewClosedHandler', ['view_closed_id', `ctx-${seed}`]);
		expect(viewClosedLog, 'View closed handler log not found for contextual bar').toBeTruthy();

		// Verify room is present
		const roomEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_room');
		expect(roomEntry?.args[1], 'Room id should be present for contextual bar view closed').toBe('GENERAL');

		// Verify user is present
		const userEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_user');
		expect(userEntry?.args[1], 'User should be present for contextual bar view closed').toBe('user1');
	});
});
