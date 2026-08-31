import type { Locator } from '@playwright/test';

import { FlexTab } from './flextab';

export class DeviceInfoFlexTab extends FlexTab {
	constructor(locator: Locator) {
		super(locator);
	}

	get btnLogoutDevice(): Locator {
		return this.root.getByRole('button', { name: 'Log out device' });
	}

	getDeviceInfoId(deviceId: string): Locator {
		return this.root.getByText(deviceId, { exact: true });
	}
}
