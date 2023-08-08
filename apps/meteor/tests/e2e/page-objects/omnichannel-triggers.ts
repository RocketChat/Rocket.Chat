import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelTriggers {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get btnNew(): Locator {
		return this.page.locator('role=button[name="Create trigger"]');
	}

	get Name(): Locator {
		return this.page.locator('[placeholder="Name"]');
	}

	get Description(): Locator {
		return this.page.locator('[placeholder="Description"]');
	}

	get visitorTimeOnSite(): Locator {
		return this.page.locator('text=Visitor time on site');
	}

	get visitorPageURL(): Locator {
		return this.page.locator('text=Visitor page URL');
	}

	get chatOpenedByVisitor(): Locator {
		return this.page.locator('text=Chat opened by the visitor');
	}

	get addTime(): Locator {
		return this.page.locator('[placeholder="Time in seconds"]');
	}

	get impersonateAgent(): Locator {
		return this.page.locator('text=Impersonate next agent from queue');
	}

	get impersonateAgentListBox(): Locator {
		return this.page.locator('ol[role="listbox"] >> text=Impersonate next agent from queue');
	}

	get customAgent(): Locator {
		return this.page.locator('text=Custom agent');
	}

	get agentName(): Locator {
		return this.page.locator('[placeholder="Name of agent"]');
	}

	get textArea(): Locator {
		return this.page.locator('textarea');
	}

	get saveBtn(): Locator {
		return this.page.locator('button >> text="Save"');
	}

	get firstRowInTable() {
		return this.page.locator('table tr:first-child td:first-child');
	}

	firstRowInTriggerTable(triggersName1: string) {
		return this.page.locator(`text="${triggersName1}"`);
	}

	get toastMessage(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success >> nth=0');
	}

	get inputSearch() {
		return this.page.locator('[placeholder="Search"]');
	}

	get pageTitle() {
		return this.page.locator('[data-qa-type="PageHeader-title"]');
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

	public async createTrigger(triggersName: string, triggerMessage: string) {
		await this.btnNew.click();
		await this.Name.fill(triggersName);
		await this.Description.fill('Creating a fresh trigger');
		await this.visitorPageURL.click();
		await this.visitorTimeOnSite.click();
		await this.addTime.click();
		await this.addTime.fill('5s');
		await this.impersonateAgent.click();
		await this.textArea.fill(triggerMessage);
		await this.saveBtn.click();
	}

	public async updateTrigger(newName: string) {
		await this.Name.fill(newName);
		await this.Description.fill('Updating the existing trigger');
		await this.visitorTimeOnSite.click();
		await this.chatOpenedByVisitor.click();
		await this.impersonateAgent.click();
		await this.customAgent.click();
		await this.agentName.fill('Rocket.cat');
		await this.saveBtn.click();
	}
}
