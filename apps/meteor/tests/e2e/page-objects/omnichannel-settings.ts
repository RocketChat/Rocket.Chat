import type { Locator, Page } from '@playwright/test';

export class OmnichannelSettings {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	group(sectionName: string): Locator {
		return this.page.locator(`h2 >> text="${sectionName}"`);
	}

	get labelHideWatermark(): Locator {
		return this.page.locator('label', { has: this.page.locator('[data-qa-setting-id="Livechat_hide_watermark"]') });
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save changes"]');
	}
}
