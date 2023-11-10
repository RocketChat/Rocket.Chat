import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelAgents {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get inputUsername(): Locator {
		return this.page.locator('input[name="agentAutoComplete"]');
	}

	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get btnAdd(): Locator {
		return this.page.locator('role=button[name="Add agent"]');
	}

	get firstRowInTable() {
		return this.page.locator('[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:first-child');
	}

	get btnDeletefirstRowInTable() {
		return this.page.locator('button[title="Remove"]');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}

	get btnEdit(): Locator {
		return this.page.locator('[data-qa="AgentInfoAction-Edit"]');
	}

	get btnRemove(): Locator {
		return this.page.locator('.rcx-vertical-bar button[title="Remove"]');
	}

	get btnSave(): Locator {
		return this.page.locator('[data-qa="agent-edit-button-save"]');
	}

	get selectStatus(): Locator {
		return this.page.locator('[data-qa="agent-edit-text-input-status"]');
	}

	get inputMaxChats(): Locator {
		return this.page.locator('input[name="maxNumberSimultaneousChat"]');
	}

	get selectDepartment(): Locator {
		return this.page.locator('[data-qa="agent-edit-text-input-departments"]');
	}
}
