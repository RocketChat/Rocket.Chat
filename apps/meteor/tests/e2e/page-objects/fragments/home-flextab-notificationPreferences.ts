import type { Locator, Page } from '@playwright/test';

export class HomeFlextabNotificationPreferences {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get dialogNotificationPreferences(): Locator {
		return this.page.getByRole('dialog', { name: 'Notifications Preferences' });
	}

	getPreferenceByDevice(device: string): Locator {
		return this.page.locator(`//div[@id="${device}Alert"]`);
	}

	async selectDropdownById(text: string): Promise<void> {
		await this.dialogNotificationPreferences.locator(`//div[@id="${text}"]`).click();
	}

	async selectOptionByLabel(text: string): Promise<void> {
		await this.page.getByRole('listbox').getByRole('option', { name: text }).click();
	}

	async selectDevice(text: string): Promise<void> {
		await this.dialogNotificationPreferences.getByRole('button', { name: text }).click();
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
