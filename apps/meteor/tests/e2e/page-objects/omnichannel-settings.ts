import type { Locator, Page } from '@playwright/test';

export class OmnichannelSettings {
	protected readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get labelLivechatLogo(): Locator {
		return this.page.locator('//label[@title="Assets_livechat_widget_logo"]');
	}

	get imgLivechatLogoPreview(): Locator {
		return this.page.locator('//label[@title="Assets_livechat_widget_logo"]/following-sibling::span >> role=img[name="Asset preview"]');
	}

	get inputLivechatLogo(): Locator {
		return this.page.locator('//label[@title="Assets_livechat_widget_logo"]/following-sibling::span >> input[type="file"]');
	}

	get btnDeleteLivechatLogo(): Locator {
		return this.page.locator('//label[@title="Assets_livechat_widget_logo"]/following-sibling::span >> role=button[name="Delete"]');
	}

	group(sectionName: string): Locator {
		return this.page.locator(`[data-qa-section="${sectionName}"] h2 >> text="${sectionName}"`);
	}

	get labelHideWatermark(): Locator {
		return this.page.locator('label', { has: this.page.locator('[data-qa-setting-id="Livechat_hide_watermark"]') });
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save changes"]');
	}
}
