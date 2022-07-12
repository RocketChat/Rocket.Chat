import { Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class Global extends BasePage {
	get modalConfirm(): Locator {
		return this.page.locator('.rcx-modal .rcx-button--danger');
	}

	get modalFilePreview(): Locator {
		return this.page.locator('.rc-modal .upload-preview-file');
	}

	get getToastBar(): Locator {
		return this.page.locator('.rcx-toastbar');
	}

	get getToastBarError(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--error');
	}

	get getToastBarSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get flexNav(): Locator {
		return this.page.locator('.flex-nav');
	}

	async confirmPopup(): Promise<void> {
		await this.modalConfirm.waitFor();
		await this.modalConfirm.click();
	}

	async dismissToastBar(): Promise<void> {
		await this.getToastBar.locator('button').click();
	}

	get modal(): Locator {
		return this.page.locator('#modal-root');
	}

	get btnModalCancel(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--secondary');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}
}
