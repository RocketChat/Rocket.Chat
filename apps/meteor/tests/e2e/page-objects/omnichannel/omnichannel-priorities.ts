import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { ToastMessages } from '../fragments';
import { FlexTab } from '../fragments/flextabs/flextab';
import { OmnichannelResetPrioritiesModal } from '../fragments/modals';
import { Table } from '../fragments/table';

class OmnichannelEditPriorityFlexTab extends FlexTab {
	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Priority' }));
		this.toastMessage = new ToastMessages(page);
	}
}

class OmnichannelPrioritiesTable extends Table {
	constructor(page: Page, fallback: Locator) {
		super(page.getByRole('table', { name: 'Priorities' }), fallback);
	}
}

export class OmnichannelPriorities extends OmnichannelAdmin {
	readonly editPriority: OmnichannelEditPriorityFlexTab;

	readonly resetPrioritiesModal: OmnichannelResetPrioritiesModal;

	readonly table: OmnichannelPrioritiesTable;

	constructor(page: Page) {
		super(page);
		this.resetPrioritiesModal = new OmnichannelResetPrioritiesModal(page);
		this.editPriority = new OmnichannelEditPriorityFlexTab(page);
		this.table = new OmnichannelPrioritiesTable(page, this.emptyState);
	}

	async goTo() {
		await this.goToRoute('priorities');
		await this.waitForPage();
	}

	private async waitForPage() {
		await this.getPageHeader('Priorities').waitFor({ state: 'visible' });
		await this.table.waitForDisplay();
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
