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
		return this.page.locator('text= New');
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
		return this.page.locator('text=Save');
	}

	get firstRowInTable() {
		return this.page.locator('table tr:first-child td:first-child');
	}

	firstRowInTriggerTable(triggersName: string) {
		return this.page.locator(`[qa-user-id="${triggersName}"]`);
	}

	get toastMessage(): Locator {
		return this.page.locator('text=Saved');
	}

	get inputSearch() {
		return this.page.locator('[placeholder="Search"]');
	}

	get pageTitle() {
		return this.page.locator('[data-qa-type="PageHeader-title"]');
	}

	get btnDeletefirstRowInTable() {
		return this.page.locator('button[title="Remove"]');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}

	get removeToastMessage(): Locator {
		return this.page.locator('text=Trigger removed');
	}
}
