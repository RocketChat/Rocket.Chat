import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelCannedResponses extends OmnichannelAdministration {
	get inputShortcut() {
		return this.page.getByRole('textbox', { name: 'Shortcut', exact: true });
	}

	get inputMessage() {
		return this.page.getByRole('textbox', { name: 'Message', exact: true });
	}

	get radioPublic() {
		// NOTE: Playwright struggles to click the 1x1 px radio button, so we select the label instead
		return this.page.locator('label', { hasText: /^Public$/ });
	}

	get radioDepartment() {
		// NOTE: Playwright struggles to click the 1x1 px radio button, so we select the label instead
		return this.page.locator('label', { hasText: /^Department$/ });
	}

	get radioPrivate() {
		// NOTE: Playwright struggles to click the 1x1 px radio button, so we select the label instead
		return this.page.locator('label', { hasText: /^Private$/ });
	}

	get inputTags() {
		return this.page.getByRole('textbox', { name: 'Tags', exact: true });
	}

	get btnAddTag() {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	listItem(name: string) {
		return this.page.getByText(`!${name}`, { exact: true });
	}

	async addTag(tag: string) {
		await this.inputTags.fill(tag);
		await this.btnAddTag.click();
	}

	get btnEdit() {
		return this.page.getByRole('button', { name: 'Edit', exact: true });
	}

	get btnSave(): Locator {
		return this.page.getByRole('button', { name: 'Save', exact: true });
	}

	get btnNew(): Locator {
		return this.page.locator('role=button[name="Create canned response"]').first();
	}
}
