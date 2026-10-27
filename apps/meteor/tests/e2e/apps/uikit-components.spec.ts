import type { Page } from '@playwright/test';

import { appUiKitComponentsTest } from '../../data/apps/app-packages';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { findAppLogItem, getAppLogs, installLocalTestPackage, uninstallApp } from '../utils/apps';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state, timezoneId: 'UTC' });

/** The view state the app received on submit, keyed by block id and then by action id. */
type ViewState = Record<string, Record<string, unknown>>;

/**
 * Types into the focused combobox, because a multi select drops its placeholder when its listbox opens.
 * Clicks only once the debounced search has replaced the unfiltered options, because a click while the list
 * changes is lost. Waits for the listbox to animate out after the pick, so its options cannot match the next pick.
 */
const pickOption = async (page: Page, combobox: ReturnType<Page['getByPlaceholder']>, term: string, option: string | RegExp) => {
	await combobox.click();
	await page.keyboard.type(term);
	await expect(page.getByRole('option').filter({ hasNotText: term })).toHaveCount(0);
	await page.getByRole('option', { name: option, exact: typeof option === 'string' }).click();
	await expect(page.getByRole('listbox')).toHaveCount(0);
};

test.describe.serial('Apps > UIKit components', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let appId: string;

	const getSubmittedState = async (api: Parameters<typeof getAppLogs>[0], viewId: string): Promise<ViewState> => {
		const { logs } = await getAppLogs(api, appId);
		const viewSubmitLog = findAppLogItem(logs, 'executeViewSubmitHandler', ['view_submit_id', viewId]);
		expect(viewSubmitLog, `View submit handler log not found for ${viewId}`).toBeTruthy();

		const stateEntry = viewSubmitLog?.entries.find((e) => e.args[0] === 'view_submit_state');
		return JSON.parse(stateEntry?.args[1] ?? '{}');
	};

	test.beforeAll(async () => {
		const result = await installLocalTestPackage(appUiKitComponentsTest);
		appId = result.app.id;
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel('general');
	});

	test.afterAll(async () => {
		await uninstallApp(appId);
	});

	test('should submit the initial values of the elements in a modal', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test modal ${seed}`);

		const surface = page.getByRole('dialog', { name: 'UIKit Components Modal' });

		await test.step('initial selections render as chips', async () => {
			await expect(surface.getByText('user2', { exact: true })).toBeVisible();
			// The channels select and the multi conversations select, which defaults to the current room
			await expect(surface.getByText('general', { exact: true })).toHaveCount(2);
		});

		const interactionResponse = page.waitForResponse('**/ui.interaction/*');
		await surface.getByRole('button', { name: 'Submit' }).click();
		await interactionResponse;

		const state = await getSubmittedState(api, `modal-${seed}`);

		expect(state).toMatchObject({
			users: { users_select: 'user2' },
			channels: { channels_select: 'GENERAL' },
			number: { number_input: '42' },
			datetime: { datetimepicker: 1767225600 },
		});
	});

	test('should submit the values picked in the data-backed selects and typed in the formatted inputs', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test modal ${seed}`);

		const surface = page.getByRole('dialog', { name: 'UIKit Components Modal' });

		await test.step('pick users, channels and conversations from the server', async () => {
			await pickOption(page, surface.getByPlaceholder('Pick users'), 'user3', /^user3/);
			await pickOption(page, surface.getByPlaceholder('Pick channels'), 'general', 'general');
			await pickOption(page, surface.getByPlaceholder('Pick a conversation'), 'general', 'general');
		});

		await test.step('fill the number, email, URL and date-time inputs', async () => {
			await surface.getByLabel('Number input').fill('7');
			await surface.getByLabel('Email input').fill('user3@email.com');
			await surface.getByLabel('URL input').fill('https://rocket.chat');
			await surface.getByLabel('Date and time').fill('2026-03-15T10:30');
		});

		const interactionResponse = page.waitForResponse('**/ui.interaction/*');
		await surface.getByRole('button', { name: 'Submit' }).click();
		await interactionResponse;

		const state = await getSubmittedState(api, `modal-${seed}`);

		expect(state).toMatchObject({
			multi_users: { multi_users_select: ['user3'] },
			multi_channels: { multi_channels_select: ['GENERAL'] },
			conversations: { conversations_select: 'GENERAL' },
			number: { number_input: '7' },
			email: { email_text_input: 'user3@email.com' },
			url: { url_text_input: 'https://rocket.chat' },
			datetime: { datetimepicker: Date.UTC(2026, 2, 15, 10, 30) / 1000 },
		});
	});

	test('should trigger a block action from a users select section accessory in a modal', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test modal ${seed}`);

		const surface = page.getByRole('dialog', { name: 'UIKit Components Modal' });

		const interactionResponse = page.waitForResponse('**/ui.interaction/*');
		await pickOption(page, surface.getByPlaceholder('Accessory user'), 'user3', 'user3');
		await interactionResponse;

		const { logs } = await getAppLogs(api, appId);
		const blockActionLog = findAppLogItem(logs, 'executeBlockActionHandler', ['block_action_view', `modal-${seed}`]);
		expect(blockActionLog, 'Block action handler log not found for the section accessory').toBeTruthy();

		const actionIdEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_actionId');
		expect(actionIdEntry?.args[1]).toBe('accessory_users_select');

		const valueEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_value');
		expect(JSON.parse(valueEntry?.args[1] ?? 'null')).toBe('user3');

		await surface.getByRole('button', { name: 'Close' }).click();
	});

	test('should preselect the current conversation in a contextual bar', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test ctx ${seed}`);

		// Opening a contextual bar navigates the client to /channel/general/app/{viewId}; wait for it before using locators.
		await page.waitForURL(/\/app\//);

		const surface = page.getByRole('dialog', { name: 'UIKit Components Contextual Bar' });

		const interactionResponse = page.waitForResponse('**/ui.interaction/*');
		await surface.getByRole('button', { name: 'Submit' }).click();
		await interactionResponse;

		const state = await getSubmittedState(api, `ctx-${seed}`);

		expect(state).toMatchObject({
			multi_conversations: { multi_conversations_select: ['GENERAL'] },
		});
	});

	test('should preselect the current conversation in a modal', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test modal ${seed}`);

		const surface = page.getByRole('dialog', { name: 'UIKit Components Modal' });

		const interactionResponse = page.waitForResponse('**/ui.interaction/*');
		await surface.getByRole('button', { name: 'Submit' }).click();
		await interactionResponse;

		const state = await getSubmittedState(api, `modal-${seed}`);

		expect(state).toMatchObject({
			multi_conversations: { multi_conversations_select: ['GENERAL'] },
		});
	});

	test('should trigger a block action from a users select outside an input block in a message', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test message ${seed}`);

		const message = poHomeChannel.content.lastUserMessage;

		const interactionResponse = page.waitForResponse('**/ui.interaction/*');
		await pickOption(page, message.getByPlaceholder('Message user'), 'user3', 'user3');
		await interactionResponse;

		const { logs } = await getAppLogs(api, appId);
		const blockActionLog = findAppLogItem(logs, 'executeBlockActionHandler', ['block_action_actionId', 'message_users_select']);
		expect(blockActionLog, 'Block action handler log not found for the message users select').toBeTruthy();

		const valueEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_value');
		expect(JSON.parse(valueEntry?.args[1] ?? 'null')).toBe('user3');

		const roomEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_room');
		expect(roomEntry?.args[1]).toBe('GENERAL');

		const containerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_container');
		expect(containerEntry?.args[1]).toBe('message');
	});

	test('should display the table, video and context actions blocks of a message', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/open-uikit-components-test display ${seed}`);

		const message = poHomeChannel.content.lastUserMessage;
		const table = message.getByRole('table');

		await test.step('the table shows its header and rows', async () => {
			// Playwright gives a `th` the columnheader role only with `scope="col"`.
			await expect(table.getByRole('cell', { name: 'Service' })).toBeVisible();
			await expect(table.getByRole('cell', { name: 'API' })).toBeVisible();
			await expect(table.getByRole('cell', { name: '99.98%' })).toBeVisible();
		});

		await test.step('the video shows its thumbnail and title', async () => {
			await expect(message.getByRole('button', { name: 'Big Buck Bunny, an animated short film' })).toBeVisible();
			await expect(message.getByText('Big Buck Bunny', { exact: true })).toBeVisible();
		});

		const getBlockActionValue = async (actionId: string) => {
			const { logs } = await getAppLogs(api, appId);
			const blockActionLog = findAppLogItem(logs, 'executeBlockActionHandler', ['block_action_actionId', actionId]);
			expect(blockActionLog, `Block action handler log not found for ${actionId}`).toBeTruthy();

			const containerEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_container');
			expect(containerEntry?.args[1]).toBe('message');

			const valueEntry = blockActionLog?.entries.find((e) => e.args[0] === 'block_action_value');
			return JSON.parse(valueEntry?.args[1] ?? 'null');
		};

		await test.step('a feedback button sends its value and stays pressed', async () => {
			const goodAnswer = message.getByRole('button', { name: 'Good answer' });

			const interactionResponse = page.waitForResponse('**/ui.interaction/*');
			await goodAnswer.click();
			await interactionResponse;

			await expect(goodAnswer).toHaveAttribute('aria-pressed', 'true');
			expect(await getBlockActionValue('feedback')).toBe('good');
		});

		await test.step('an icon button sends its value', async () => {
			const interactionResponse = page.waitForResponse('**/ui.interaction/*');
			await message.getByRole('button', { name: 'Show details' }).click();
			await interactionResponse;

			expect(await getBlockActionValue('details')).toBe('details');
		});
	});
});
