import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelCurrentChats {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get btnToastClose(): Locator {
		return this.page.locator('.rcx-toastbar').locator('button');
	}

	get currentChatsLink(): Locator {
		return this.page.locator('a[href="omnichannel/current"]');
	}

	get guestField(): Locator {
		return this.page.locator('[data-qa="current-chats-guest"]');
	}

	get servedByField(): Locator {
		return this.page.locator('[data-qa="autocomplete-agent"]');
	}

	get statusField(): Locator {
		return this.page.locator('[data-qa="current-chats-status"]');
	}

	get fromField(): Locator {
		return this.page.locator('[data-qa="current-chats-from"]');
	}

	get toField(): Locator {
		return this.page.locator('[data-qa="current-chats-to"]');
	}

	get departmentField(): Locator {
		return this.page.locator('[data-qa="autocomplete-department"]');
	}

	get tagsField(): Locator {
		return this.page.locator('[data-qa="current-chats-tags"]');
	}

	get formOptions(): Locator {
		return this.page.locator('[data-qa="current-chats-options"]');
	}

	get clearFiltersOption(): Locator {
		return this.page.locator('[data-qa="current-chats-options-clearFilters"]');
	}

	get removeAllClosedOption(): Locator {
		return this.page.locator('[data-qa="current-chats-options-removeAllClosed"]');
	}

	get customFieldsOption(): Locator {
		return this.page.locator('[data-qa="current-chats-options-customFields"]');
	}

	get table(): Locator {
		return this.page.locator('.rcx-table');
	}

	get tableHeaderName(): Locator {
		return this.page.locator('[data-qa="current-chats-header-name"]');
	}

	get tableHeaderDepartment(): Locator {
		return this.page.locator('[data-qa="current-chats-header-department"]');
	}

	get tableHeaderServedBy(): Locator {
		return this.page.locator('[data-qa="current-chats-header-servedBy"]');
	}

	get tableHeaderStartedAt(): Locator {
		return this.page.locator('[data-qa="current-chats-header-startedAt"]');
	}

	get tableHeaderLastMessage(): Locator {
		return this.page.locator('[data-qa="current-chats-header-lastMessage"]');
	}

	get tableHeaderStatus(): Locator {
		return this.page.locator('[data-qa="current-chats-header-status"]');
	}

	get tableHeaderRemove(): Locator {
		return this.page.locator('[data-qa="current-chats-header-remove"]');
	}

	get tableHeader(): Locator {
		return this.page.locator('[data-qa=""]');
	}

	async doOpenOptions(): Promise<void> {
		await this.formOptions.click();
	}
}
