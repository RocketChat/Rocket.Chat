import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class AutoTranslateFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Auto-Translate' }));
	}

	get checkboxAutomaticTranslation(): Locator {
		return this.root.getByRole('checkbox', { name: 'Automatic Translation' });
	}

	get textAutomaticTranslation(): Locator {
		return this.root.getByText('Automatic Translation', { exact: true });
	}

	get textEncryptedRoomCallout(): Locator {
		return this.root.getByText('Automatic translation not available');
	}

	async setAutomaticTranslation(enabled: boolean): Promise<void> {
		if ((await this.checkboxAutomaticTranslation.isChecked()) === enabled) {
			return;
		}
		await this.textAutomaticTranslation.click();
	}
}
