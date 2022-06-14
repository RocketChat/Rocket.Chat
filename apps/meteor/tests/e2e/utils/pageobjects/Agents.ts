import { Locator, expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class Agents extends BasePage {
	get agentsLink(): Locator {
		return this.page.locator('a[href="omnichannel/agents"]');
	}

	get textAgentsTitle(): Locator {
		return this.page.locator('h2 >> text="Agents"');
	}

	get inputAgentsUserName(): Locator {
		return this.page.locator('input').first();
	}

	get userOption(): Locator {
		return this.page.locator('.rcx-option >> text="Rocket.Cat"');
	}

	get btnAddAgents(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add"');
	}

	get agentAdded(): Locator {
		return this.page.locator('[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:first-child');
	}

	get agentListStatus(): Locator {
		return this.page.locator('[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:nth-child(4)');
	}

	get userInfoTab(): Locator {
		return this.page.locator('h3 div');
	}

	get agentInfo(): Locator {
		return this.page.locator('[data-qa="AgentInfoUserInfoUserName"]');
	}

	get agentInfoUserInfoLabel(): Locator {
		return this.page.locator('[data-qa="AgentInfoUserInfoLabel"]');
	}

	get btnClose(): Locator {
		return this.page.locator('[data-qa="VerticalBarActionClose"]');
	}

	get userAvatar(): Locator {
		return this.page.locator('[data-qa="AgentUserInfoAvatar"]');
	}

	get btnEdit(): Locator {
		return this.page.locator('[data-qa="AgentInfoAction-Edit"]');
	}

	get btnRemove(): Locator {
		return this.page.locator('[data-qa="AgentInfoAction-Remove"]');
	}

	public availabilityOption(availability: string): Locator {
		return this.page.locator(`div.rcx-options[role="listbox"] div.rcx-box ol[role="listbox"] li[value="${availability}"]`);
	}

	get btnTableRemove(): Locator {
		return this.page.locator(
			'[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:nth-child(5) [title="Remove"]',
		);
	}

	get agentStatus(): Locator {
		return this.page.locator('[data-qa="AgentEditTextInput-Status"]');
	}

	get btnAgentSave(): Locator {
		return this.page.locator('[data-qa="AgentEditButtonSave"]');
	}

	public getAgentInputs(id: string): Locator {
		return this.page.locator(`[data-qa="AgentEditTextInput-${id}"]`);
	}

	public async doAddAgent(): Promise<void> {
		await this.textAgentsTitle.waitFor();
		await this.inputAgentsUserName.type('Rocket.Cat', { delay: 50 });

		await this.userOption.click();
		await this.btnAddAgents.click();
	}

	public async getListOfExpectedInputs(): Promise<void> {
		const inputs = ['Name', 'Username', 'Email', 'Departaments', 'Status'].map((id) => this.getAgentInputs(id));
		await Promise.all(inputs.map((input) => expect(input).toBeVisible()));
		await this.btnClose.click();
	}

	public async doChangeUserStatus(availability: string): Promise<void> {
		await this.agentAdded.click();
		await this.btnEdit.click();
		await this.agentStatus.click();
		await this.availabilityOption(availability).click();
		await this.btnAgentSave.click();
	}

	public async doRemoveAgent(): Promise<void> {
		await this.agentAdded.click();
		await this.btnRemove.click();
	}
}
