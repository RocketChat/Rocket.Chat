import { Locator } from '@playwright/test';

import BasePage from './BasePage';

class Global extends BasePage {
	// Modal
	public modalOverlay(): Locator {
		return this.getPage().locator('.rc-modal-wrapper');
	}

	public modal(): Locator {
		return this.getPage().locator('.rcx-modal');
	}

	public modalConfirm(): Locator {
		return this.getPage().locator('.rcx-modal .rcx-button--primary-danger');
	}

	public modalCancel(): Locator {
		return this.getPage().locator('.rc-modal .js-modal');
	}

	public modalPasswordField(): Locator {
		return this.getPage().locator('.rc-modal [type="password"]');
	}

	public modalFileName(): Locator {
		return this.getPage().locator('.rc-modal #file-name');
	}

	public modalFileDescription(): Locator {
		return this.getPage().locator('.rc-modal #file-description');
	}

	public modalFilePreview(): Locator {
		return this.getPage().locator('.rc-modal .upload-preview-file');
	}

	public modalFileTitle(): Locator {
		return this.getPage().locator('.rc-modal .upload-preview-title');
	}

	public toastAlert(): Locator {
		return this.getPage().locator('.toast-message');
	}

	public async confirmPopup(): Promise<void> {
		await this.modalConfirm().waitFor();
		// browser.pause(500);
		await this.modalConfirm().click();
	}

	// public async setWindowSize(width, height): Promise<void> {
	// 	cy.viewport(width, height);
	// }
	//
	public async dismissToast(): Promise<void> {
		await this.toastAlert().click();
	}
}

export default Global;
