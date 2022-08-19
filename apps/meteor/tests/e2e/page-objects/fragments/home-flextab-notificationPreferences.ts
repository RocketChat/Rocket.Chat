import type { Locator, Page } from '@playwright/test';

export class HomeFlextabNotificationPreferences {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnSave(): Locator {
		return this.page.locator('//aside//button[contains(text(), "Save")]');
	}

	getPreferenceByDevice(device: string): Locator {
		return this.page.locator(`//div[@id="${device}Alert"]`);
	}

	async selectDropdownById(text: string): Promise<void> {
		await this.page.locator(`//div[@id="${text}"]`).click();
	}

	async selectOptionByLabel(text: string): Promise<void> {
		await this.page.locator(`li.rcx-option >> text="${text}"`).click();
	}

	async selectDevice(text: string): Promise<void> {
		await this.page.locator(`[data-qa-id="${text}-notifications"]`).click();
	}

	async updateDevicePreference(device: string): Promise<void> {
		await this.selectDevice(device);
		await this.selectDropdownById(`${device}Alert`);
		await this.selectOptionByLabel('Mentions');
	}

	async updateAllNotificationPreferences(): Promise<void> {
		await this.updateDevicePreference('Desktop');
		await this.updateDevicePreference('Mobile');
		await this.updateDevicePreference('Email');
	}
}
