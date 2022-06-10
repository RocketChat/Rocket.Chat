import { Locator, expect } from '@playwright/test';

import BasePage from './BasePage';

export default class Agents extends BasePage {
	public agentsLink(): Locator {
		return this.getPage().locator('a[href="omnichannel/agents"]');
	}

	public textAgentsTitle(): Locator {
		return this.getPage().locator('h2 >> text="Agents"');
	}

	public inputAgentsUserName(): Locator {
		return this.getPage().locator('input').first();
	}

	public userOption(): Locator {
		return this.getPage().locator('.rcx-option >> text="Rocket.Cat"');
	}

	public btnAddAgents(): Locator {
		return this.getPage().locator('button.rcx-button--primary.rcx-button >> text="Add"');
	}

	public agentAdded(): Locator {
		return this.getPage().locator('[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:first-child');
	}

	public agentListStatus(): Locator {
		return this.getPage().locator('[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:nth-child(4)');
	}

	public userInfoTab(): Locator {
		return this.getPage().locator('h3 div');
	}

	public agentInfo(): Locator {
		return this.getPage().locator('[data-qa="AgentInfoUserInfoUserName"]');
	}

	public agentInfoUserInfoLabel(): Locator {
		return this.getPage().locator('[data-qa="AgentInfoUserInfoLabel"]');
	}

	public btnClose(): Locator {
		return this.getPage().locator('[data-qa="VerticalBarActionClose"]');
	}

	public userAvatar(): Locator {
		return this.getPage().locator('[data-qa="AgentUserInfoAvatar"]');
	}

	public btnEdit(): Locator {
		return this.getPage().locator('[data-qa="AgentInfoAction-Edit"]');
	}

	public btnRemove(): Locator {
		return this.getPage().locator('[data-qa="AgentInfoAction-Remove"]');
	}

	public availabilityOption(availability: string): Locator {
		return this.getPage().locator(`div.rcx-options[role="listbox"] div.rcx-box ol[role="listbox"] li[value="${availability}"]`);
	}

	public btnTableRemove(): Locator {
		return this.getPage().locator(
			'[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:nth-child(5) [title="Remove"]',
		);
	}

	public agentStatus(): Locator {
		return this.getPage().locator('[data-qa="AgentEditTextInput-Status"]');
	}

	public btnAgentSave(): Locator {
		return this.getPage().locator('[data-qa="AgentEditButtonSave"]');
	}

	public getAgentInputs(id: string): Locator {
		return this.getPage().locator(`[data-qa="AgentEditTextInput-${id}"]`);
	}

	public async doAddAgent(): Promise<void> {
		await this.textAgentsTitle().waitFor();
		await this.inputAgentsUserName().type('Rocket.Cat', { delay: 50 });

		await this.userOption().click();
		await this.btnAddAgents().click();
	}

	public async getListOfExpectedInputs(): Promise<void> {
		const inputs = ['Name', 'Username', 'Email', 'Departaments', 'Status'].map((id) => this.getAgentInputs(id));
		await Promise.all(inputs.map((input) => expect(input).toBeVisible()));
		await this.btnClose().click();
	}

	public async doChangeUserStatus(availability: string): Promise<void> {
		await this.agentAdded().click();
		await this.btnEdit().click();
		await this.agentStatus().click();
		await this.availabilityOption(availability).click();
		await this.btnAgentSave().click();
	}

	public async doRemoveAgent(): Promise<void> {
		await this.agentAdded().click();
		await this.btnRemove().click();
	}
}
