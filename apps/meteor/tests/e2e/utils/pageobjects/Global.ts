import { Locator } from '@playwright/test';

import BasePage from './BasePage';

class Global extends BasePage {
	// Modal
	public modalOverlay(): Locator {
		return this.getPage().locator('.rc-modal-wrapper');
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

	public getToastBar(): Locator {
		return this.getPage().locator('.rcx-toastbar');
	}

	public getToastBarError(): Locator {
		return this.getPage().locator('.rcx-toastbar.rcx-toastbar--error');
	}

	public getToastBarSuccess(): Locator {
		return this.getPage().locator('.rcx-toastbar.rcx-toastbar--success');
	}

	public async confirmPopup(): Promise<void> {
		await this.modalConfirm().waitFor();
		// browser.pause(500);
		await this.modalConfirm().click();
	}

	public async dismissToastBar(): Promise<void> {
		await this.getToastBar().locator('button').click();
	}
}

export default Global;
