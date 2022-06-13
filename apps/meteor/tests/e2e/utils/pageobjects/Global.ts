import { Locator } from '@playwright/test';

import BasePage from './BasePage';

export default class Global extends BasePage {
	public modalConfirm(): Locator {
		return this.getPage().locator('.rcx-modal .rcx-button--primary-danger');
	}

	public modalFilePreview(): Locator {
		return this.getPage().locator('.rc-modal .upload-preview-file');
	}

	public getToastBar(): Locator {
		return this.getPage().locator('.rcx-toastbar');
	}

	public getToastBarError(): Locator {
		return this.getPage().locator('.rcx-toastbar.rcx-toastbar--error');
	}

	public getToastBarSuccess(): Locator {
		return this.getPage().locator('.rcx-toastbar.rcx-toastbar--success');
	}

	public flexNav(): Locator {
		return this.getPage().locator('.flex-nav');
	}

	public async confirmPopup(): Promise<void> {
		await this.modalConfirm().waitFor();
		await this.modalConfirm().click();
	}

	public async dismissToastBar(): Promise<void> {
		await this.getToastBar().locator('button').click();
	}
}
