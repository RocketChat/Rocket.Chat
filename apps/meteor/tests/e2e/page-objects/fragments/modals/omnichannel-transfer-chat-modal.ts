import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';
import { Listbox } from '../listbox';

export class OmnichannelTransferChatModal extends Modal {
	private readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Forward chat' }));
		this.listbox = new Listbox(page.getByRole('listbox'));
	}

	get inputComment(): Locator {
		return this.root.locator('textarea[name="comment"]');
	}

	get inputForwardDepartment(): Locator {
		return this.root.getByLabel('Forward to department').getByRole('textbox');
	}

	get inputForwardUser(): Locator {
		return this.root.getByLabel('Forward to user').getByRole('textbox');
	}

	get btnForward(): Locator {
		return this.root.locator('role=button[name="Forward"]');
	}

	async selectDepartment(name: string) {
		await this.inputForwardDepartment.click();
		await this.inputForwardDepartment.fill(name);
		await this.listbox.selectOption(name);
	}

	async selectUser(name: string, id?: string) {
		await this.inputForwardUser.click();
		await this.inputForwardUser.fill(name);
		await this.listbox.selectOption(id || name);
	}
}
