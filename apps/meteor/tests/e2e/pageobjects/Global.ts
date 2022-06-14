import { Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class Global extends BasePage {
	get modalConfirm(): Locator {
		return this.page.locator('.rcx-modal .rcx-button--primary-danger');
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

	public async confirmPopup(): Promise<void> {
		await this.modalConfirm.waitFor();
		await this.modalConfirm.click();
	}

	public async dismissToastBar(): Promise<void> {
		await this.getToastBar.locator('button').click();
	}

	get modal(): Locator {
		return this.page.locator('#modal-root');
	}

	get btnModalCancel(): Locator {
		return this.page.locator(
			'#modal-root div dialog div.rcx-modal__inner div.rcx-modal__footer div div button.rcx-button--ghost.rcx-button',
		);
	}

	get btnModalRemove(): Locator {
		return this.page.locator(
			'#modal-root div dialog div.rcx-modal__inner div.rcx-modal__footer div div button.rcx-button--primary-danger.rcx-button',
		);
	}
}
