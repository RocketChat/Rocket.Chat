import { appUiKitRoomTest } from '../../data/apps/app-packages';
import { IS_EE } from '../config/constants';
import { getAppLogs, installLocalTestPackage } from '../fixtures/insert-apps';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
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
		await poHomeChannel.goto();
		await poHomeChannel.waitForHome();
		await page.getByRole('link', { name: 'general' }).click();
	});

	/**
	 * Finds a log entry matching a handler method and a specific debug label.
	 * The app logs using `this.getLogger().debug(label, value)`, creating entries with args = [label, value].
	 * Each handler invocation creates a log group with `method` like `app:executeBlockActionHandler`.
	 */
	function findLogEntry(logs: Array<{ method: string; entries: Array<{ args: unknown[] }> }>, methodFragment: string, label: string) {
		return logs.find((log) => String(log.method).includes(methodFragment) && log.entries.some((entry) => entry.args[0] === label));
	}

	test('should include correct data in executeBlockActionHandler when triggered in a message', async ({ page }) => {
		// Send a message with a button via the slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal message');

		// Wait for the message with the button to appear and click it
		const button = page.locator('role=button[name="Click!"]').last();
		await button.waitFor({ state: 'visible' });
		await button.click();

		// Wait a moment for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		const blockActionLog = findLogEntry(logsResult.logs, 'executeBlockActionHandler', 'block_action_room');
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

	test('should include correct data in executeBlockActionHandler when triggered in a contextual bar surface', async ({ page }) => {
		// Open a contextual bar via slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal ctx');

		// Opening a contextual bar via the Apps Engine causes a client-side URL navigation
		// (e.g. /channel/general/app/{viewId}). Wait for that navigation to complete before
		// using any locators, otherwise Playwright throws "Target page, context or browser
		// has been closed" while the navigation is still in progress.
		await page.waitForURL(/\/app\//);

		// Wait for the contextual bar to appear and click the button
		await page.getByLabel('UIKit Room Test Contextual Bar').getByRole('button', { name: 'Click!' }).click();

		// Wait for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent block action log with ctx-button actionId
		const blockActionLogs = logsResult.logs.filter(
			(log) =>
				String(log.method).includes('executeBlockActionHandler') &&
				log.entries.some((e) => e.args[0] === 'block_action_actionId' && e.args[1] === 'ctx-button'),
		);
		const blockActionLog = blockActionLogs[blockActionLogs.length - 1];
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
		await poHomeChannel.btnContextualbarClose.click();
	});

	test('should include correct data in executeBlockActionHandler when triggered in a modal surface', async ({ page }) => {
		// Open a modal via slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal modal');

		// Wait for the modal to appear and click the button
		const modal = page.getByRole('dialog', { name: 'UIKit Room Test Modal' });
		await modal.waitFor({ state: 'visible' });
		const button = modal.getByRole('button', { name: 'Click!' });
		await button.click();

		// Wait for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent block action log with modal-button actionId
		const blockActionLogs = logsResult.logs.filter(
			(log) =>
				String(log.method).includes('executeBlockActionHandler') &&
				log.entries.some((e) => e.args[0] === 'block_action_actionId' && e.args[1] === 'modal-button'),
		);
		const blockActionLog = blockActionLogs[blockActionLogs.length - 1];
		expect(blockActionLog, 'Block action handler log not found for modal').toBeTruthy();

		// Verify room is present
		const roomEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_room');
		expect(roomEntry?.args[1], 'Room id should be present for modal block action').toBe('GENERAL');

		// Verify user is present
		const userEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_user');
		expect(userEntry?.args[1], 'User should be present for modal block action').toBe('user1');

		// Verify container type is view (modal)
		const containerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_container');
		expect(containerEntry?.args[1], 'Container type should be view for modal').toBe('view');

		// Close the modal for the next test
		await modal.getByRole('button', { name: 'Close' }).click();
	});

	test('should include correct data in executeViewSubmitHandler when triggered in a modal surface', async ({ page }) => {
		// Open a modal via slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal modal');

		// Wait for the modal and submit it
		const modal = page.getByRole('dialog', { name: 'UIKit Room Test Modal' });
		await modal.waitFor({ state: 'visible' });
		await modal.getByRole('button', { name: 'Submit' }).click();

		// Wait for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		const viewSubmitLog = findLogEntry(logsResult.logs, 'executeViewSubmitHandler', 'view_submit_room');
		expect(viewSubmitLog, 'View submit handler log not found for modal').toBeTruthy();

		// Verify room is present
		const roomEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_room');
		expect(roomEntry?.args[1], 'Room id should be present for modal view submit').toBe('GENERAL');

		// Verify user is present
		const userEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_user');
		expect(userEntry?.args[1], 'User should be present for modal view submit').toBe('user1');

		// Verify triggerId is present
		const triggerEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_triggerId');
		expect(triggerEntry?.args[1], 'TriggerId should be present').not.toBe('no-triggerId');
	});

	test('should include correct data in executeViewSubmitHandler when triggered in a contextual bar surface', async ({ page }) => {
		// Open a contextual bar via slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal ctx');

		// Wait for the client-side navigation to the contextual bar URL to complete
		await page.waitForURL(/\/app\//);

		// Wait for the contextual bar and submit it
		const submitButton = page.locator('[data-qa="ContextualbarContent"]').getByRole('button', { name: 'Submit' });
		await submitButton.waitFor({ state: 'visible' });
		await submitButton.click();

		// Wait for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent view submit log
		const viewSubmitLogs = logsResult.logs.filter(
			(log) => String(log.method).includes('executeViewSubmitHandler') && log.entries.some((e) => e.args[0] === 'view_submit_room'),
		);
		const viewSubmitLog = viewSubmitLogs[viewSubmitLogs.length - 1];
		expect(viewSubmitLog, 'View submit handler log not found for contextual bar').toBeTruthy();

		// Verify room is present
		const roomEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_room');
		expect(roomEntry?.args[1], 'Room id should be present for contextual bar view submit').toBe('GENERAL');

		// Verify user is present
		const userEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_user');
		expect(userEntry?.args[1], 'User should be present for contextual bar view submit').toBe('user1');
	});

	test('should include correct data in executeViewClosedHandler when triggered in a modal surface', async ({ page }) => {
		// Open a modal via slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal modal');

		// Wait for the modal and close it (via X button, not submit)
		const modal = page.getByRole('dialog', { name: 'UIKit Room Test Modal' });
		await modal.waitFor({ state: 'visible' });
		await modal.getByRole('button', { name: 'Close' }).click();

		// Wait for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		const viewClosedLog = findLogEntry(logsResult.logs, 'executeViewClosedHandler', 'view_closed_room');
		expect(viewClosedLog, 'View closed handler log not found for modal').toBeTruthy();

		// Verify room is present
		const roomEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_room');
		expect(roomEntry?.args[1], 'Room id should be present for modal view closed').toBe('GENERAL');

		// Verify user is present
		const userEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_user');
		expect(userEntry?.args[1], 'User should be present for modal view closed').toBe('user1');
	});

	test('should include correct data in executeViewClosedHandler when triggered in a contextual bar surface', async ({ page }) => {
		// Open a contextual bar via slash command
		await poHomeChannel.content.dispatchSlashCommand('/open-uikit-room-test-modal ctx');

		// Wait for the client-side navigation to the contextual bar URL to complete
		await page.waitForURL(/\/app\//);

		// Wait for the contextual bar to appear and close it
		await poHomeChannel.btnContextualbarClose.waitFor({ state: 'visible' });
		await poHomeChannel.btnContextualbarClose.click();

		// Wait for the handler to process
		await page.waitForTimeout(1000);

		// Fetch app logs and validate
		const logsResult = await getAppLogs(appId);
		expect(logsResult.logs).toBeDefined();

		// Find the most recent view closed log
		const viewClosedLogs = logsResult.logs.filter(
			(log) => String(log.method).includes('executeViewClosedHandler') && log.entries.some((e) => e.args[0] === 'view_closed_room'),
		);
		const viewClosedLog = viewClosedLogs[viewClosedLogs.length - 1];
		expect(viewClosedLog, 'View closed handler log not found for contextual bar').toBeTruthy();

		// Verify room is present
		const roomEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_room');
		expect(roomEntry?.args[1], 'Room id should be present for contextual bar view closed').toBe('GENERAL');

		// Verify user is present
		const userEntry = viewClosedLog?.entries.find((e) => e.args[0] === 'view_closed_user');
		expect(userEntry?.args[1], 'User should be present for contextual bar view closed').toBe('user1');
	});
});
