import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';
import { expect } from '../../../utils/test';
import { Listbox } from '../listbox';

export class OmnichannelContactReviewModal extends Modal {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Review contact' }), page);
		this.listbox = new Listbox(page.getByRole('listbox'));
	}

	private getFieldByName(name: string): Locator {
		return this.root.getByLabel(name, { exact: true });
	}

	async solveConfirmation(field: string, value: string) {
		await this.getFieldByName(field).click();
		await this.listbox.selectOption(value);
		const responsePromise = this.page?.waitForResponse('**/api/v1/omnichannel/contacts.conflicts');
		await this.save();
		const responseListener = await responsePromise;
		expect(responseListener?.status()).toBe(200);
	}
}
