import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

type TriggerConditions = 'Visitor page URL' | 'Visitor time on site' | 'Chat opened by visitor' | 'After guest registration';

class OmnichannelEditTriggerFlexTab extends FlexTab {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'trigger' }));
		this.listbox = new Listbox(page);
	}

	private get inputDescription(): Locator {
		return this.root.getByRole('textbox', { name: 'Description', exact: true });
	}

	private get conditionLabel(): Locator {
		return this.root.getByText('Condition', { exact: true });
	}

	private get senderLabel(): Locator {
		return this.root.getByText('Sender', { exact: true });
	}

	private async selectCondition(condition: string) {
		await this.conditionLabel.click();
		await this.listbox.selectOption(condition);
	}

	private async selectSender(sender: 'queue' | 'custom') {
		await this.senderLabel.click();
		await this.listbox.selectOption(sender);
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

	async fillTriggerForm(
		data: Partial<{
			name: string;
			description: string;
			condition: TriggerConditions;
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

	async removeTrigger(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}

	public async createTrigger(triggersName: string, triggerMessage: string, condition: TriggerConditions, conditionValue?: number | string) {
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

	public async updateTrigger(name: string, triggerMessage: string, condition: TriggerConditions = 'Chat opened by visitor') {
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
