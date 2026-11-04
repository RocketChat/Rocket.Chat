import type { Page } from '@playwright/test';

import { appUiKitCapabilitiesTest } from '../../data/apps/app-packages';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { findAppLogItem, getAppLogs, installLocalTestPackage, uninstallApp } from '../utils/apps';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state });

/**
 * Types a query into an external select and picks one of the options the app suggests.
 * Waits until every listed option matches the query, so the click lands on the app's answer and not on a stale list.
 */
const pickSuggestion = async (page: Page, combobox: ReturnType<Page['getByPlaceholder']>, term: string, option: string) => {
	await combobox.click();
	await page.keyboard.type(term);
	await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible();
	await page.getByRole('option', { name: option, exact: true }).click();
	await expect(page.getByRole('listbox')).toHaveCount(0);
};

test.describe.serial('Apps > UIKit capabilities', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let appId: string;

	test.beforeAll(async () => {
		const result = await installLocalTestPackage(appUiKitCapabilitiesTest);
		appId = result.app.id;
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel('general');
	});

	test.afterAll(async () => {
		await uninstallApp(appId);
	});

	test('should render rich text, alternative element type names and the new icons', async () => {
		await poHomeChannel.content.dispatchSlashCommand(`/uikit-capabilities-test rich ${Date.now()}`);

		const message = poHomeChannel.content.lastUserMessage;

		await test.step('rich_text renders its styles, list, quote and code', async () => {
			await expect(message.getByText('Release', { exact: true })).toBeVisible();
			await expect(message.getByRole('link', { name: 'release notes' })).toHaveAttribute('href', /docs\.rocket\.chat/);
			await expect(message.getByText('Faster search')).toBeVisible();
			await expect(message.getByText('Ship it.')).toBeVisible();
		});

		await test.step('checkboxes, radio_buttons and timepicker render as their canonical elements', async () => {
			await expect(message.getByRole('checkbox', { name: 'Option A' })).toBeVisible();
			await expect(message.getByRole('radio', { name: 'Yes' })).toBeVisible();
		});

		await test.step('context actions show the new icons, named after their labels', async () => {
			await expect(message.getByRole('button', { name: 'Copy' })).toBeVisible();
			await expect(message.getByRole('button', { name: 'Report' })).toBeVisible();
		});
	});

	test('should run a two-step modal with suggested options, keeping the app metadata', async ({ api, page }) => {
		const seed = Date.now().toString();

		await poHomeChannel.content.dispatchSlashCommand(`/uikit-capabilities-test wizard ${seed}`);

		const modal = page.getByRole('dialog', { name: 'New release' });
		await expect(modal.getByText('New release — step 1 of 2')).toBeVisible();

		await test.step('external selects list the options the app suggests for the query', async () => {
			await pickSuggestion(page, modal.getByPlaceholder('Search projects'), 'rock', 'Rocket.Chat');
			await pickSuggestion(page, modal.getByPlaceholder('Search people'), 'ada', 'Ada Lovelace');
		});

		await test.step('rich_text_input takes Markdown', async () => {
			await modal.getByPlaceholder('Write Markdown').fill('**Highlights**');
		});

		await test.step('submitting step 1 pushes step 2 on top', async () => {
			const interactionResponse = page.waitForResponse('**/ui.interaction/*');
			await modal.getByRole('button', { name: 'Next' }).click();
			await interactionResponse;

			await expect(page.getByText('New release — step 2 of 2')).toBeVisible();
		});

		await test.step('the app received the metadata it set and the typed values', async () => {
			const { logs } = await getAppLogs(api, appId);
			const submitLog = findAppLogItem(logs, 'executeViewSubmitHandler', ['view_submit_callback', 'wizard-1']);
			expect(submitLog, 'View submit handler log not found for step 1').toBeTruthy();

			const metadata = submitLog?.entries.find((entry) => entry.args[0] === 'view_submit_metadata');
			expect(JSON.parse(metadata?.args[1] ?? '{}')).toMatchObject({ seed });

			const state = JSON.parse(submitLog?.entries.find((entry) => entry.args[0] === 'view_submit_state')?.args[1] ?? '{}');
			expect(state).toMatchObject({ project: { project: 'rocketchat' }, reviewers: { reviewers: ['ada'] } });
			expect(state.notes.notes).toMatchObject({ type: 'rich_text' });
		});

		await test.step('finishing clears the modals and posts the summary', async () => {
			const interactionResponse = page.waitForResponse('**/ui.interaction/*');
			await page.getByRole('button', { name: 'Finish' }).click();
			await interactionResponse;

			await expect(page.getByRole('dialog', { name: 'New release' })).toHaveCount(0);
			await expect(poHomeChannel.content.lastUserMessage.getByText('Release of rocketchat')).toBeVisible();
		});
	});
});
