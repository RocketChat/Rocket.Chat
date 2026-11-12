import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetChannelAndReturnFullRoom, deleteChannel, sendMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const uniqueMessage = (): string => `msg-${faker.string.uuid()}`;

const dismissModals = async (page: Page) => {
	const starterModal = page.getByRole('dialog', { name: 'Starter plan active' });
	await starterModal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
	if (await starterModal.isVisible()) {
		await starterModal.getByRole('button', { name: 'Close' }).click();
		await expect(starterModal).not.toBeVisible();
	}
};

test.describe('multi-message-forward', () => {
	let poHomeChannel: HomeChannel;
	let sourceChannel: string;
	let sourceRoomId: string;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		const source = await createTargetChannelAndReturnFullRoom(api);
		sourceChannel = source.channel.name as string;
		sourceRoomId = source.channel._id;
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(sourceChannel);
		await dismissModals(page);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteChannel(api, sourceChannel), deleteChannel(api, targetChannel)]);
	});

	test('should enter selection mode and forward multiple messages to another channel', async ({ api, page }) => {
		const msg1 = uniqueMessage();
		const msg2 = uniqueMessage();

		await sendMessage(api, sourceRoomId, msg1);
		await sendMessage(api, sourceRoomId, msg2);

		// Hover first message and click Forward
		await poHomeChannel.content.getMessageByText(msg1).hover();
		await page.locator('role=button[name="Forward message"]').click();

		// Selection callout footer should appear with 1 message selected
		await expect(page.getByText('1 messages selected')).toBeVisible();

		// Click the second message row to toggle selection
		await poHomeChannel.content.getMessageByText(msg2).click();

		// Selection count should update to 2
		await expect(page.getByText('2 messages selected')).toBeVisible();

		// Click Forward button in the selection footer
		await page.getByRole('button', { name: 'Forward', exact: true }).click();

		// Modal should open with Forward message title
		await expect(page.getByRole('dialog').getByText('Forward message')).toBeVisible();

		// Select recipient channel
		await page.getByRole('textbox', { name: 'Person or channel', exact: true }).click();
		await page.keyboard.type(targetChannel);
		await page.locator('#position-container').getByText(targetChannel).waitFor();
		await page.locator('#position-container').getByText(targetChannel).click();

		// Confirm forward in modal
		await page.locator('#modal-root').getByRole('button', { name: 'Forward', exact: true }).click();
		await expect(page.getByRole('dialog').getByText('Forward message')).not.toBeVisible({ timeout: 15000 });

		// Navigate to target channel and verify both messages arrived
		await poHomeChannel.gotoChannel(targetChannel);
		await dismissModals(page);
		await expect(poHomeChannel.content.getMessageByText(msg1)).toBeVisible();
		await expect(poHomeChannel.content.getMessageByText(msg2)).toBeVisible();

		// Back in source channel, selection mode should be reset
		await poHomeChannel.gotoChannel(sourceChannel);
		await dismissModals(page);
		await expect(page.getByText('messages selected')).not.toBeVisible();
	});

	test('should exit selection mode when Cancel is clicked', async ({ api, page }) => {
		const msg = uniqueMessage();
		await sendMessage(api, sourceRoomId, msg);

		await poHomeChannel.content.getMessageByText(msg).hover();
		await page.locator('role=button[name="Forward message"]').click();

		await expect(page.getByText('1 messages selected')).toBeVisible();

		// Click Cancel button in selection callout
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();

		// Selection mode should exit
		await expect(page.getByText('messages selected')).not.toBeVisible();
	});
});
