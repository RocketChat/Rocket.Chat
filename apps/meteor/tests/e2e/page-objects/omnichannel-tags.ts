import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelTags extends OmnichannelAdministration {
	get btnCreateTag(): Locator {
		return this.page.locator('header').locator('role=button[name="Create tag"]');
	}

	get contextualBar(): Locator {
		return this.page.locator('div[role="dialog"].rcx-vertical-bar');
	}

	get btnSave(): Locator {
		return this.contextualBar.locator('role=button[name="Save"]');
	}

	get btnCancel(): Locator {
		return this.contextualBar.locator('role=button[name="Cancel"]');
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
	}

	get inputSearch(): Locator {
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	get confirmDeleteModal(): Locator {
		return this.page.locator('dialog:has(h2:has-text("Are you sure?"))');
	}

	get btnCancelDeleteModal(): Locator {
		return this.confirmDeleteModal.locator('role=button[name="Cancel"]');
	}

	get btnConfirmDeleteModal(): Locator {
		return this.confirmDeleteModal.locator('role=button[name="Delete"]');
	}

	get btnContextualbarClose(): Locator {
		return this.contextualBar.locator('button[aria-label="Close"]');
	}

	btnDeleteByName(name: string): Locator {
		return this.page.locator(`role=link[name="${name} Remove"] >> role=button`);
	}

	findRowByName(name: string): Locator {
		return this.page.locator(`tr:has-text("${name}")`);
	}

	get inputDepartments(): Locator {
		return this.page.locator('input[placeholder="Select an option"]');
	}

	private selectOption(name: string): Locator {
		return this.page.locator(`[role=option][value="${name}"]`);
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
	}

	async selectDepartment({ name, _id }: { name: string; _id: string }) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.selectOption(_id).click();
	}
}
