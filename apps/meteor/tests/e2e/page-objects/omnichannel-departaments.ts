import { Locator, Page } from '@playwright/test';

export class OmnichannelDepartaments {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnToastClose(): Locator {
		return this.page.locator('.rcx-toastbar').locator('button');
	}

	get departmentsLink(): Locator {
		return this.page.locator('a[href="omnichannel/departments"]');
	}

	get btnNewDepartment(): Locator {
		return this.page.locator('button.rcx-button >> text="New"');
	}

	get btnSaveDepartment(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Save"');
	}

	get btnBack(): Locator {
		return this.page.locator('button.rcx-button >> text="Back"');
	}

	get enabledToggle(): Locator {
		return this.page.locator('[data-qa="DepartmentEditToggle-Enabled"] span label');
	}

	get nameInput(): Locator {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Name"]');
	}

	get descriptionInput(): Locator {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Description"]');
	}

	get showOnRegistrationPage(): Locator {
		return this.page.locator('[data-qa="DepartmentEditToggle-ShowOnRegistrationPage"] span label');
	}

	get emailInput(): Locator {
		return this.page.locator('[data-qa="DepartmentEditTextInput-Email"]');
	}

	get showOnOfflinePageToggle(): Locator {
		return this.page.locator('[data-qa="DepartmentEditToggle-ShowOnOfflinePage"] span label');
	}

	get selectLiveChatDepartmentOfflineMessageToChannel(): Locator {
		return this.page.locator('[data-qa="DepartmentSelect-LivechatDepartmentOfflineMessageToChannel"]');
	}

	get requestTagBeforeClosingChatToggle(): Locator {
		return this.page.locator('[data-qa="DiscussionToggle-RequestTagBeforeCLosingChat"] span label');
	}

	get selectAgentsTable(): Locator {
		return this.page.locator('[data-qa="DepartmentSelect-AgentsTable"]');
	}

	get btnAddAgent(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add"');
	}

	virtuosoOptions(option: string): Locator {
		return this.page.locator(`[data-test-id="virtuoso-scroller"] .rcx-option >> text="${option}"`);
	}

	get departmentAdded(): Locator {
		return this.page.locator('table tr:first-child td:first-child ');
	}

	get btnTableDeleteDepartment(): Locator {
		return this.page.locator('table tr:first-child td:nth-child(6) button');
	}

	get btnModalCancelDeleteDepartment(): Locator {
		return this.page.locator('#modal-root .rcx-modal .rcx-modal__footer .rcx-button--secondary');
	}

	get btnModalDeleteDepartment(): Locator {
		return this.page.locator('#modal-root .rcx-modal .rcx-modal__footer .rcx-button--danger');
	}

	get modalDepartment(): Locator {
		return this.page.locator('#modal-root');
	}

	async doAddAgent(): Promise<void> {
		await this.enabledToggle.click();
		await this.nameInput.type('rocket.cat');
	}

	async doAddDepartments(): Promise<void> {
		await this.enabledToggle.click();
		await this.nameInput.type('any_name');
		await this.descriptionInput.type('any_description');
		await this.showOnOfflinePageToggle.click();
		await this.emailInput.type('any_email@mail.com');
		await this.showOnRegistrationPage.click();
		await this.selectLiveChatDepartmentOfflineMessageToChannel.click();
		await this.selectLiveChatDepartmentOfflineMessageToChannel.type('general');
		await this.virtuosoOptions('general').click();
		await this.selectAgentsTable.click();
		await this.btnSaveDepartment.click();
	}

	async doEditDepartments(): Promise<void> {
		await this.enabledToggle.click();
		await this.nameInput.click({ clickCount: 3 });
		await this.page.keyboard.press('Backspace');
		await this.nameInput.fill('any_name_edit');
		await this.descriptionInput.click({ clickCount: 3 });
		await this.page.keyboard.press('Backspace');
		await this.descriptionInput.fill('any_description_edited');
		await this.btnSaveDepartment.click();
	}

	async doBackToPrincipalScreen(): Promise<void> {
		await this.departmentAdded.click();
		await this.btnBack.click();
	}
}
