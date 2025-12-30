import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { ToastMessages } from '../fragments';
import { FlexTab } from '../fragments/flextab';
import { OmnichannelResetPrioritiesModal } from '../fragments/modals';

class OmnichannelEditPriorityFlexTab extends FlexTab {
	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Priority' }));
		this.toastMessage = new ToastMessages(page);
	}

	errorMessage(message: string): Locator {
		return this.root.locator(`.rcx-field__error >> text="${message}"`);
	}

	async save() {
		await this.btnSave.click();
		await this.toastMessage.dismissToast();
	}
}

export class OmnichannelPriorities extends OmnichannelAdmin {
	readonly editPriority: OmnichannelEditPriorityFlexTab;

	readonly resetPrioritiesModal: OmnichannelResetPrioritiesModal;

	constructor(page: Page) {
		super(page);
		this.resetPrioritiesModal = new OmnichannelResetPrioritiesModal(page);
		this.editPriority = new OmnichannelEditPriorityFlexTab(page);
	}

	get btnReset() {
		return this.page.locator('role=button[name="Reset"]');
	}

	async resetPriorities() {
		await this.btnReset.click();
		await this.resetPrioritiesModal.reset();
		await this.toastMessage.dismissToast();
	}

	findPriority(name: string) {
		return this.page.getByRole('link', { name, exact: true });
	}
}
