import type { Locator, Page } from '@playwright/test';

export class OmnichannelSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get linkDepartments(): Locator {
		return this.page.locator('a[href="/omnichannel/departments"]');
	}

	get linkAgents(): Locator {
		return this.page.locator('a[href="/omnichannel/agents"]');
	}

	get linkManagers(): Locator {
		return this.page.locator('a[href="/omnichannel/managers"]');
	}

	get linkCustomFields(): Locator {
		return this.page.locator('a[href="/omnichannel/customfields"]');
	}

	get linkCurrentChats(): Locator {
		return this.page.locator('a[href="/omnichannel/current"]');
	}

	get linkTriggers(): Locator {
		return this.page.locator('a[href="/omnichannel/triggers"]');
	}

	get linkSlaPolicies(): Locator {
		return this.page.locator('a[href="/omnichannel/sla-policies"]');
	}

	get linkPriorities(): Locator {
		return this.page.locator('a[href="/omnichannel/priorities"]');
	}
}
