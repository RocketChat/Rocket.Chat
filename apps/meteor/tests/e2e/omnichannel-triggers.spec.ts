import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelTriggers } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-triggers', () => {
	let poOmnichannelTriggers: OmnichannelTriggers;

	let trigger: {
		enabled: boolean;
		runOnce: boolean;
		name: string;
		description: string;
		conditions: { name: string; value: string | number };
		actions: {
			name: string;
			params: {
				sender: string;
				msg: string;
				name: string;
			};
		};
	}[];

	test.beforeAll(() => {
		trigger = [
			{
				name: faker.datatype.uuid(),
				description: 'some description',
				enabled: true,
				runOnce: true,
				conditions: {
					name: 'Visitor page URL',
					value: 'some value',
				},
				actions: {
					name: '',
					params: {
						sender: 'Impersonate next agent from queue',
						msg: 'some message',
						name: '',
					},
				},
			},
			{
				name: faker.datatype.uuid(),
				description: 'some description',
				enabled: true,
				runOnce: true,
				conditions: {
					name: 'Visitor page URL',
					value: 'some value',
				},
				actions: {
					name: '',
					params: {
						sender: 'Impersonate next agent from queue',
						msg: 'some message',
						name: '',
					},
				},
			},
		];
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelTriggers = new OmnichannelTriggers(page);

		await page.goto('/omnichannel');
		await poOmnichannelTriggers.sidenav.linkTriggers.click();
	});

	test('expect create new trigger', async () => {
		await poOmnichannelTriggers.btnNew.click();
		await (trigger[0].enabled ? poOmnichannelTriggers.btnEnabled.check() : poOmnichannelTriggers.btnEnabled.uncheck());
		await (trigger[0].runOnce ? poOmnichannelTriggers.btnRunOnce.check() : poOmnichannelTriggers.btnRunOnce.uncheck());
		await poOmnichannelTriggers.inputName.fill(trigger[0].name);
		await poOmnichannelTriggers.inputDescription.fill(trigger[0].description);
		await poOmnichannelTriggers.selectCondition.click();
		await poOmnichannelTriggers.getOption(trigger[0].conditions.name).click();
		await poOmnichannelTriggers.inputConditionValue.fill(trigger[0].conditions.value as string);
		await poOmnichannelTriggers.selectAction.click();
		await poOmnichannelTriggers.getOption(trigger[0].actions.params.sender).click();
		if (await poOmnichannelTriggers.inputActionAgentName.isVisible()) {
			await poOmnichannelTriggers.inputActionAgentName.fill(trigger[0].actions.params.name);
		}
		await poOmnichannelTriggers.inputActionMsg.fill(trigger[0].actions.params.msg);
		await poOmnichannelTriggers.btnSave.click();

		await expect(poOmnichannelTriggers.findRowByName(trigger[0].name)).toBeVisible();

		await poOmnichannelTriggers.btnNew.click();
		await (trigger[1].enabled ? poOmnichannelTriggers.btnEnabled.check() : poOmnichannelTriggers.btnEnabled.uncheck());
		await (trigger[1].runOnce ? poOmnichannelTriggers.btnRunOnce.check() : poOmnichannelTriggers.btnRunOnce.uncheck());
		await poOmnichannelTriggers.inputName.fill(trigger[1].name);
		await poOmnichannelTriggers.inputDescription.fill(trigger[1].description);
		await poOmnichannelTriggers.selectCondition.click();
		await poOmnichannelTriggers.getOption(trigger[1].conditions.name).click();
		await poOmnichannelTriggers.inputConditionValue.fill(trigger[1].conditions.value as string);
		await poOmnichannelTriggers.selectAction.click();
		await poOmnichannelTriggers.getOption(trigger[1].actions.params.sender).click();
		if (await poOmnichannelTriggers.inputActionAgentName.isVisible()) {
			await poOmnichannelTriggers.inputActionAgentName.fill(trigger[1].actions.params.name);
		}
		await poOmnichannelTriggers.inputActionMsg.fill(trigger[1].actions.params.msg);
		await poOmnichannelTriggers.btnSave.click();

		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();
	});

	test('expect update trigger', async () => {
		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();
		await poOmnichannelTriggers.findRowByName(trigger[1].name).click();

		trigger[1].name = `edited-${trigger[1].name}`;
		trigger[1].description = 'edited description';
		trigger[1].enabled = !trigger[1].enabled;
		trigger[1].runOnce = !trigger[1].runOnce;
		trigger[1].conditions.name = 'Visitor time on site';
		trigger[1].conditions.value = '1';
		trigger[1].actions.params.sender = 'Custom agent';
		trigger[1].actions.params.name = 'agent name';
		trigger[1].actions.params.msg = 'edited message';

		await (trigger[1].enabled ? poOmnichannelTriggers.btnEnabled.check() : poOmnichannelTriggers.btnEnabled.uncheck());
		await (trigger[1].runOnce ? poOmnichannelTriggers.btnRunOnce.check() : poOmnichannelTriggers.btnRunOnce.uncheck());
		await poOmnichannelTriggers.inputName.fill(trigger[1].name);
		await poOmnichannelTriggers.inputDescription.fill(trigger[1].description);
		await poOmnichannelTriggers.selectCondition.click();
		await poOmnichannelTriggers.getOption(trigger[1].conditions.name).click();
		await poOmnichannelTriggers.inputConditionValue.fill(trigger[1].conditions.value as string);
		await poOmnichannelTriggers.selectAction.click();
		await poOmnichannelTriggers.getOption(trigger[1].actions.params.sender).click();
		if (await poOmnichannelTriggers.inputActionAgentName.isVisible()) {
			await poOmnichannelTriggers.inputActionAgentName.fill(trigger[1].actions.params.name);
		}
		await poOmnichannelTriggers.inputActionMsg.fill(trigger[1].actions.params.msg);
		await poOmnichannelTriggers.btnSave.click();

		await poOmnichannelTriggers.findRowByName(trigger[1].name).click();
		await (trigger[1].enabled
			? expect(poOmnichannelTriggers.btnEnabled).toBeChecked()
			: expect(poOmnichannelTriggers.btnEnabled).not.toBeChecked());
		await (trigger[1].runOnce
			? expect(poOmnichannelTriggers.btnRunOnce).toBeChecked()
			: expect(poOmnichannelTriggers.btnRunOnce).not.toBeChecked());
		await expect(poOmnichannelTriggers.inputName).toHaveValue(trigger[1].name);
		await expect(poOmnichannelTriggers.inputDescription).toHaveValue(trigger[1].description);
		await expect(poOmnichannelTriggers.selectCondition).toContainText(trigger[1].conditions.name);
		await expect(poOmnichannelTriggers.inputConditionValue).toHaveValue(trigger[1].conditions.value);
		await expect(poOmnichannelTriggers.selectAction).toContainText(trigger[1].actions.params.sender);
		if (await poOmnichannelTriggers.inputActionAgentName.isVisible()) {
			await expect(poOmnichannelTriggers.inputActionAgentName).toHaveValue(trigger[1].actions.params.name);
		}
		await expect(poOmnichannelTriggers.inputActionMsg).toHaveValue(trigger[1].actions.params.msg);
	});

	test('expect switch trigger information', async () => {
		await expect(poOmnichannelTriggers.findRowByName(trigger[0].name)).toBeVisible();
		await expect(poOmnichannelTriggers.findRowByName(trigger[1].name)).toBeVisible();

		await poOmnichannelTriggers.findRowByName(trigger[0].name).click();
		await poOmnichannelTriggers.findRowByName(trigger[1].name).click();

		await (trigger[1].enabled
			? expect(poOmnichannelTriggers.btnEnabled).toBeChecked()
			: expect(poOmnichannelTriggers.btnEnabled).not.toBeChecked());
		await (trigger[1].runOnce
			? expect(poOmnichannelTriggers.btnRunOnce).toBeChecked()
			: expect(poOmnichannelTriggers.btnRunOnce).not.toBeChecked());
		await expect(poOmnichannelTriggers.inputName).toHaveValue(trigger[1].name);
		await expect(poOmnichannelTriggers.inputDescription).toHaveValue(trigger[1].description);
		await expect(poOmnichannelTriggers.selectCondition).toContainText(trigger[1].conditions.name);
		await expect(poOmnichannelTriggers.inputConditionValue).toHaveValue(trigger[1].conditions.value as string);
		await expect(poOmnichannelTriggers.selectAction).toContainText(trigger[1].actions.params.sender);
		if (await poOmnichannelTriggers.inputActionAgentName.isVisible()) {
			await expect(poOmnichannelTriggers.inputActionAgentName).toHaveValue(trigger[1].actions.params.name);
		}
		await expect(poOmnichannelTriggers.inputActionMsg).toHaveValue(trigger[1].actions.params.msg);
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
