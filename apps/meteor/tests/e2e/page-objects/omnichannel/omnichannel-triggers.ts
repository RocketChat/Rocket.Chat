import type { Locator, Page } from '@playwright/test';
import type { ILivechatTriggerType } from '@rocket.chat/core-typings';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

class OmnichannelEditTriggerFlexTab extends FlexTab {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'trigger' }));
		this.listbox = new Listbox(page.getByRole('listbox'));
	}

	private get inputDescription(): Locator {
		return this.root.getByRole('textbox', { name: 'Description' });
	}

	private get conditionLabel(): Locator {
		return this.root.getByLabel('Condition');
	}

	private get senderLabel(): Locator {
		return this.root.getByLabel('Sender');
	}

	private async selectCondition(condition: string) {
		await this.conditionLabel.click();
		await this.listbox.selectOption(condition);
	}

	private get inputAgentName(): Locator {
		return this.root.locator('input[name="actions.0.params.name"]');
	}

	private get inputConditionValue(): Locator {
		return this.root.locator('input[name="conditions.0.value"]');
	}

	private get inputTriggerMessage(): Locator {
		return this.root.locator('textarea[name="actions.0.params.msg"]');
	}

	private async selectSender(sender: 'queue' | 'custom') {
		await this.senderLabel.click();
		await this.listbox.selectOption(sender);
	}

	async fillTriggerForm(
		data: Partial<{
			name: string;
			description: string;
			condition: ILivechatTriggerType;
			conditionValue?: string | number;
			sender: 'queue' | 'custom';
			agentName?: string;
			triggerMessage: string;
		}>,
	) {
		data.name && (await this.inputName.fill(data.name));
		data.description && (await this.inputDescription.fill(data.description));
		data.condition && (await this.selectCondition(data.condition));

		if (data.conditionValue) {
			await this.inputConditionValue.fill(data.conditionValue.toString());
		}

		data.sender && (await this.selectSender(data.sender));
		if (data.sender === 'custom' && !data.agentName) {
			throw new Error('A custom agent is required for this action');
		} else {
			data.agentName && (await this.inputAgentName.fill(data.agentName));
		}

		data.triggerMessage && (await this.inputTriggerMessage.fill(data.triggerMessage));
	}
}

class OmnichannelTriggersTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Livechat Triggers' }));
	}
}

export class OmnichannelTriggers extends OmnichannelAdmin {
	readonly editTrigger: OmnichannelEditTriggerFlexTab;

	readonly table: OmnichannelTriggersTable;

	constructor(page: Page) {
		super(page);
		this.editTrigger = new OmnichannelEditTriggerFlexTab(page);
		this.table = new OmnichannelTriggersTable(page);
	}

	firstRowInTriggerTable(triggersName1: string) {
		return this.page.locator(`text="${triggersName1}"`);
	}

	async removeTrigger(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}

	public async createTrigger(
		triggersName: string,
		triggerMessage: string,
		condition: ILivechatTriggerType,
		conditionValue?: number | string,
	) {
		await this.getButtonByType('trigger').click();
		await this.editTrigger.fillTriggerForm({
			name: triggersName,
			description: 'Creating a fresh trigger',
			condition,
			conditionValue,
			triggerMessage,
		});
		await this.editTrigger.save();
	}

	public async updateTrigger(name: string, triggerMessage: string, condition: ILivechatTriggerType = 'chat-opened-by-visitor') {
		await this.editTrigger.fillTriggerForm({
			name,
			description: 'Updating the existing trigger',
			condition,
			sender: 'custom',
			agentName: 'Rocket.cat',
			triggerMessage,
		});
		await this.editTrigger.save();
	}
}
