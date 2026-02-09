import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from '../listbox';

export class NotificationPreferencesFlexTab extends FlexTab {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Notifications Preferences' }));
		this.listbox = new Listbox(page);
	}

	getPreferenceByDevice(device: string): Locator {
		return this.root.locator(`//div[@id="${device}Alert"]`);
	}

	async selectDropdownById(text: string): Promise<void> {
		await this.root.locator(`//div[@id="${text}"]`).click();
	}

	async selectOptionByLabel(text: string): Promise<void> {
		await this.listbox.selectOption(text);
	}

	async selectDevice(text: string): Promise<void> {
		await this.root.getByRole('button', { name: text }).click();
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
