import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelTriggers } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-departments', () => {
	let poOmnichannelTriggers: OmnichannelTriggers;

	let trigger: { enabled: boolean; runOnce: boolean; name: string; description: string; actionMsg: string }[];
	test.beforeAll(() => {
		trigger = [
			{
				name: faker.datatype.uuid(),
				description: 'some description',
				enabled: true,
				runOnce: true,
				actionMsg: 'some message',
			},
			{
				name: faker.datatype.uuid(),
				description: 'some description',
				enabled: true,
				runOnce: true,
				actionMsg: 'some message',
			},
		];
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelTriggers = new OmnichannelTriggers(page);

		await page.goto('/omnichannel/triggers');
		// await poOmnichannelTriggers.sidenav.linkTriggers.click();
	});

	test('expect create new trigger', async () => {
		await poOmnichannelTriggers.btnNew.click();
		await (trigger[0].enabled ? poOmnichannelTriggers.btnEnabled.check() : poOmnichannelTriggers.btnEnabled.uncheck());
		await (trigger[0].runOnce ? poOmnichannelTriggers.btnRunOnce.check() : poOmnichannelTriggers.btnRunOnce.uncheck());
		await poOmnichannelTriggers.inputName.fill(trigger[0].name);
		await poOmnichannelTriggers.inputDescription.fill(trigger[0].description);
		await poOmnichannelTriggers.inputActionMsg.fill(trigger[0].actionMsg);
		await poOmnichannelTriggers.btnSave.click();

		await expect(poOmnichannelTriggers.findRowByName(trigger[0].name)).toBeVisible();

		await poOmnichannelTriggers.btnNew.click();
		await (trigger[1].enabled ? poOmnichannelTriggers.btnEnabled.check() : poOmnichannelTriggers.btnEnabled.uncheck());
		await (trigger[1].runOnce ? poOmnichannelTriggers.btnRunOnce.check() : poOmnichannelTriggers.btnRunOnce.uncheck());
		await poOmnichannelTriggers.inputName.fill(trigger[1].name);
		await poOmnichannelTriggers.inputDescription.fill(trigger[1].description);
		await poOmnichannelTriggers.inputActionMsg.fill(trigger[1].actionMsg);
		await poOmnichannelTriggers.btnSave.click();

		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();
	});

	test('expect update trigger', async () => {
		trigger[1].description = 'edited description';
		trigger[1].actionMsg = 'edited message';
		trigger[1].enabled = !trigger[1].enabled;
		trigger[1].runOnce = !trigger[1].runOnce;
		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();

		await poOmnichannelTriggers.findRowByName(trigger[1].name).click();
		await (trigger[1].enabled ? poOmnichannelTriggers.btnEnabled.check() : poOmnichannelTriggers.btnEnabled.uncheck());
		await (trigger[1].runOnce ? poOmnichannelTriggers.btnRunOnce.check() : poOmnichannelTriggers.btnRunOnce.uncheck());
		await poOmnichannelTriggers.inputDescription.fill(trigger[1].description);
		await poOmnichannelTriggers.inputActionMsg.fill(trigger[1].actionMsg);
		await poOmnichannelTriggers.btnSave.click();

		await poOmnichannelTriggers.findRowByName(trigger[1].name).click();
		await (trigger[1].enabled
			? expect(poOmnichannelTriggers.btnEnabled).toBeChecked()
			: expect(poOmnichannelTriggers.btnEnabled).not.toBeChecked());
		await (trigger[1].runOnce
			? expect(poOmnichannelTriggers.btnRunOnce).toBeChecked()
			: expect(poOmnichannelTriggers.btnRunOnce).not.toBeChecked());
		await expect(poOmnichannelTriggers.inputDescription).toHaveValue(trigger[1].description);
		await expect(poOmnichannelTriggers.inputActionMsg).toHaveValue(trigger[1].actionMsg);
	});

	test('switch trigger information', async () => {
		await expect(poOmnichannelTriggers.findRowByName(trigger[0].name)).toBeVisible();
		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();

		await poOmnichannelTriggers.findRowByName(trigger[0].name).click();
		await poOmnichannelTriggers.findRowByName(trigger[1].name).click();

		await expect(poOmnichannelTriggers.inputDescription).toHaveValue(trigger[1].name);
	});

	test('expect delete trigger', async () => {
		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();

		await poOmnichannelTriggers.findTriggerRemoveBtn(trigger[1].name).click();
		await poOmnichannelTriggers.btnModalConfirmDelete.click();

		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).not.toBeVisible();

		await expect(poOmnichannelTriggers.findRowByName(trigger[0].name)).toBeVisible();

		await poOmnichannelTriggers.findTriggerRemoveBtn(trigger[0].name).click();
		await poOmnichannelTriggers.btnModalConfirmDelete.click();

		await expect(poOmnichannelTriggers.findRowByName(trigger[0].name)).not.toBeVisible();
	});
});
