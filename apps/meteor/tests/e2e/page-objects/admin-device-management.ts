import type { Locator, Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';
import { MenuOptions, DevicesTable } from './fragments';
import { DeviceInfoFlexTab } from './fragments/flextabs';
import { ConfirmLogoutModal } from './fragments/modals';

export class AdminDeviceManagement extends Admin {
	readonly deviceInfo: DeviceInfoFlexTab;

	readonly deviceRowMenu: MenuOptions;

	readonly table: DevicesTable;

	readonly logoutModal: ConfirmLogoutModal;

	constructor(page: Page) {
		super(page);
		this.deviceInfo = new DeviceInfoFlexTab(page.getByRole('dialog', { name: 'Device Info' }));
		this.deviceRowMenu = new MenuOptions(page);
		this.table = new DevicesTable(page);
		this.logoutModal = new ConfirmLogoutModal(page.getByRole('dialog', { name: 'Log out device' }));
	}

	protected readonly route = AdminSectionsHref.deviceManagement;

	protected readonly title = 'Device management';

	get upsellModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Device management' });
	}

	get notAuthorizedMessage(): Locator {
		return this.page.getByRole('main').getByText('You are not authorized to view this page');
	}

	get emptyState(): Locator {
		return this.pageContent.getByRole('heading', { name: 'No results found', exact: true });
	}

	async searchUserDevice(user: string): Promise<void> {
		await this.pageContent.getByRole('textbox', { name: 'Search devices or users' }).fill(user);
	}

	async getUsersDeviceId(username: string): Promise<string> {
		await this.searchUserDevice(username);
		const deviceId = await this.pageContent
			.getByRole('row')
			.filter({ has: this.page.getByRole('cell', { name: username }) })
			.first()
			.getAttribute('aria-label');

		return deviceId || '';
	}

	async openDeviceOptionsById(deviceId: string) {
		const row = this.table.getDeviceRowById(deviceId);
		await row.getByRole('button', { name: 'Options' }).click();
	}

	async logoutDeviceById(deviceId: string) {
		await this.openDeviceOptionsById(deviceId);
		await this.deviceRowMenu.getMenuItem('Log out device').click();
		await this.logoutModal.confirmLogout();
	}
}
