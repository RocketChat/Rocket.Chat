import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelTriggers {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	headingButtonNew(name: string) {
		return this.page.locator(`role=main >> role=button[name="${name}"]`).first();
	}

	get inputName(): Locator {
		return this.page.locator('input[name="name"]');
	}

	get inputDescription(): Locator {
		return this.page.locator('input[name="description"]');
	}

	get btnSave(): Locator {
		return this.page.locator('button >> text="Save"');
	}

	firstRowInTriggerTable(triggersName1: string) {
		return this.page.locator(`text="${triggersName1}"`);
	}

	get toastMessage(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success >> nth=0');
	}

	get btnCloseToastMessage(): Locator {
		return this.toastMessage.locator('role=button');
	}

	get btnDeletefirstRowInTable() {
		return this.page.locator('table tr:first-child td:last-child button');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}

	get removeToastMessage(): Locator {
		return this.page.locator('text=Trigger removed');
	}

	get conditionLabel(): Locator {
		return this.page.locator('label >> text="Condition"')
	}

	get inputConditionValue(): Locator {
		return this.page.locator('input[name="conditions.0.value"]');
	}

	get actionLabel(): Locator {
		return this.page.locator('label >> text="Action"')
	}

	get inputAgentName(): Locator {
		return this.page.locator('input[name="actions.0.params.name"]');
	}

	get inputTriggerMessage(): Locator {
		return this.page.locator('textarea[name="actions.0.params.msg"]');
	}

	async selectCondition(condition: string) {
		await this.conditionLabel.click();
		await this.page.locator(`li.rcx-option[data-key="${condition}"]`).click();
	}

	async selectSender(sender: 'queue' | 'custom') {
		await this.actionLabel.click();
		await this.page.locator(`li.rcx-option[data-key="${sender}"]`).click();
	}

	public async createTrigger(triggersName: string, triggerMessage: string) {
		await this.headingButtonNew('Create trigger').click();
		await this.fillTriggerForm({
			name: triggersName,
			description: 'Creating a fresh trigger',
			condition: 'time-on-site',
			conditionValue: '5s',
			triggerMessage,
		});
		await this.btnSave.click();
	}

	public async updateTrigger(newName: string) {
		await this.fillTriggerForm({
			name: `edited-${newName}`,
			description: 'Updating the existing trigger',
			condition: 'chat-opened-by-visitor',
			sender: 'custom',
			agentName: 'Rocket.cat',
		});
		await this.btnSave.click();
	}

	public async fillTriggerForm(
		data: Partial<{
			name: string;
			description: string;
			condition: 'time-on-site' | 'chat-opened-by-visitor' | 'after-guest-registration';
			conditionValue?: string;
			sender: 'queue' | 'custom';
			agentName?: string;
			triggerMessage: string;
		}>,
	) {
		data.name && (await this.inputName.fill(data.name));
		data.description && (await this.inputDescription.fill(data.description));
		data.condition && (await this.selectCondition(data.condition));

		if (data.conditionValue) {
			await this.inputConditionValue.fill(data.conditionValue);
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
