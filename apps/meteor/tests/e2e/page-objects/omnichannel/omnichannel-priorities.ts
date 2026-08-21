import type { Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { ToastMessages } from '../fragments';
import { FlexTab } from '../fragments/flextabs/flextab';
import { OmnichannelResetPrioritiesModal } from '../fragments/modals';

class OmnichannelEditPriorityFlexTab extends FlexTab {
	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Priority' }));
		this.toastMessage = new ToastMessages(page);
	}
}

export class OmnichannelPriorities extends OmnichannelAdmin {
	protected readonly route = 'priorities';

	protected readonly title = 'Priorities';

	readonly editPriority: OmnichannelEditPriorityFlexTab;

	readonly resetPrioritiesModal: OmnichannelResetPrioritiesModal;

	constructor(page: Page) {
		super(page);
		this.resetPrioritiesModal = new OmnichannelResetPrioritiesModal(page);
		this.editPriority = new OmnichannelEditPriorityFlexTab(page);
	}

	get btnReset() {
		return this.page.getByRole('button', { name: 'Reset' });
	}

	async resetPriorities() {
		await this.btnReset.click();
		await this.resetPrioritiesModal.reset();
		await this.toastMessage.dismissToast();
	}

	findPriority(name: string) {
		return this.table.findRowByName(name);
	}
}
