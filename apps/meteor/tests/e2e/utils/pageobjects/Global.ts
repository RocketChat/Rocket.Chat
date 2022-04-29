import { Locator } from '@playwright/test';

import BasePage from './BasePage';

class Global extends BasePage {
	public modal(): Locator {
		return this.getPage().locator('.rcx-modal');
	}

	public modalConfirm(): Locator {
		return this.getPage().locator('.rcx-modal .rcx-button--primary-danger');
	}

	public toastAlert(): Locator {
		return this.getPage().locator('.toast-message');
	}

	public async confirmPopup(): Promise<void> {
		await this.modalConfirm().waitFor();
		await this.modalConfirm().click();
	}

	public async dismissToast(): Promise<void> {
		await this.toastAlert().click();
	}
}

export default Global;
