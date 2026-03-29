import type { Locator, Page } from 'playwright-core';

import { Account } from './account';
import { ConfirmLogoutModal, DevicesTable } from './fragments';

export class AccountManageDevices extends Account {
	readonly logoutModal: ConfirmLogoutModal;

	readonly table: DevicesTable;

	constructor(page: Page) {
		super(page);
		this.logoutModal = new ConfirmLogoutModal(page.getByRole('dialog', { name: 'Log out device' }));
		this.table = new DevicesTable(page);
	}

	get devicesPageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: 'Manage Devices' }) });
	}

	async getNthDeviceId(nth: number): Promise<string> {
		const deviceId = await this.devicesPageContent.getByRole('row').nth(nth).getAttribute('aria-label');
		if (!deviceId) {
			throw new Error(`Device ID not found for the device ${nth}`);
		}
		return deviceId || '';
	}

	async logoutDeviceById(deviceId: string) {
		await this.table.getDeviceRowById(deviceId).getByRole('button', { name: 'Logout' }).click();
		await this.logoutModal.confirmLogout();
	}
}
