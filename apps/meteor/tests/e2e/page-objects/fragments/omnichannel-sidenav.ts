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

	get linkMonitors(): Locator {
		return this.page.locator('a[href="/omnichannel/monitors"]');
	}

	get linkBusinessHours(): Locator {
		return this.page.locator('a[href="/omnichannel/businessHours"]');
	}

	get linkAnalytics(): Locator {
		return this.page.locator('a[href="/omnichannel/analytics"]');
	}

	get linkRealTimeMonitoring(): Locator {
		return this.page.locator('a[href="/omnichannel/realtime-monitoring"]');
	}

	get linkReports(): Locator {
		return this.page.locator('a[href="/omnichannel/reports"]');
	}

	get linkCannedResponses(): Locator {
		return this.page.locator('a[href="/omnichannel/canned-responses"]');
	}

	get linkUnits(): Locator {
		return this.page.locator('a[href="/omnichannel/units"]');
	}
}
