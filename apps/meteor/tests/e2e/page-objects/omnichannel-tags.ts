import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelTags extends OmnichannelAdministration {
  get btnCreateTag(): Locator {
		return this.page.locator('header').locator('role=button[name="Create tag"]');
	}

  get contextualBar(): Locator {
		return this.page.locator('div[data-qa-id="tags-contextual-bar"]');
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
		return this.page.locator('[placeholder="Search"]');
	}

  get confirmDeleteModal(): Locator {
		return this.page.locator('dialog[data-qa-id="tag-confirm-delete-modal"]');
	}

  get btnCancelDeleteModal(): Locator {
		return this.confirmDeleteModal.locator('role=button[name="Cancel"]');
	}

  get btnConfirmDeleteModal(): Locator {
		return this.confirmDeleteModal.locator('role=button[name="Delete"]');
	}

  get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

  btnDeleteByName(name: string): Locator {
		return this.page.locator(`button[data-qa-id="remove-tag-${name}"]`);
	}

  findRowByName(name: string): Locator {
		return this.page.locator(`tr[data-qa-id="${name}"]`);
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
		await this.contextualBar.click({ position: { x: 0, y: 0 } });
	}
}