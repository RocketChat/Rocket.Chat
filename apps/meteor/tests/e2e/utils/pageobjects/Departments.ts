import { Locator, expect } from '@playwright/test';

import BasePage from './BasePage';

export default class Departments extends BasePage {
	get departmentsLink(): Locator {
		return this.getPage().locator('a[href="omnichannel/agents"]');
	}

	get btnNewDepartment(): Locator {
		return this.getPage().locator('button.rcx-button >> text="New"');
	}

	get btnSaveDepartment(): Locator {
		return this.getPage().locator('button.rcx-button--primary.rcx-button >> text="Save"');
	}

	get btnBack(): Locator {
		return this.getPage().locator('button.rcx-button >> text="Back"');
	}

	get enabledToggle(): Locator {
		return this.getPage().locator('[data-qa="DepartmentLabelEnabled"]');
	}

	get nameInput(): Locator {
		return this.getPage().locator('[data-qa="DepartmentEditTextInput-Name"]');
	}

	get descriptionInput(): Locator {
		return this.getPage().locator('[data-qa="DepartmentEditTextInput-Description"]');
	}

	get showOnRegistrationPage(): Locator {
		return this.getPage().locator('[data-qa="DepartmentEditToggle-ShowOnRegistrationPage"]');
	}

	get emailInput(): Locator {
		return this.getPage().locator('[data-qa="DepartmentEditTextInput-Email"]');
	}

	get showOnOfflinePageToggle(): Locator {
		return this.getPage().locator('[data-qa="DepartmentEditToggle-ShowOnOfflinePage"]');
	}

	get selectLiveChatDepartmentOfflineMessageToChannel(): Locator {
		return this.getPage().locator('[data-qa="DepartmentSelect-LivechatDepartmentOfflineMessageToChannel"]');
	}

	get requestTagBeforeCLosingChatToggle(): Locator {
		return this.getPage().locator('[data-qa="DiscussionToggle-RequestTagBeforeCLosingChat"]');
	}

	get selectAgentsTable(): Locator {
		return this.getPage().locator('[data-qa="DepartmentSelect-AgentsTable"]');
	}

	get btnAddAgent(): Locator {
		return this.getPage().locator('button.rcx-button--primary.rcx-button >> text="Add"');
	}

	public async getAddScreen(): Promise<void> {
		const textInputs = [this.nameInput, this.descriptionInput, this.emailInput];
		const toggleButtons = [this.enabledToggle, this.showOnOfflinePageToggle, this.requestTagBeforeCLosingChatToggle];
		const select = [this.selectLiveChatDepartmentOfflineMessageToChannel, this.selectAgentsTable];
		const actionsButtons = [this.btnSaveDepartment, this.btnBack, this.btnAddAgent];
		const addScreenSelectors = [...textInputs, ...toggleButtons, ...actionsButtons, ...select];

		await Promise.all(addScreenSelectors.map((addScreenSelector) => expect(addScreenSelector).toBeVisible()));
	}

	public async doAddAgent(): Promise<void> {
		await this.enabledToggle.click();
		await this.nameInput.type('rocket.cat');
	}
}
