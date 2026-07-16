import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { Listbox } from './fragments/listbox';

export class AdminIntegrations extends Admin {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.listbox = new Listbox(page);
	}

	get btnInstructions(): Locator {
		return this.page.getByRole('button', { name: 'Instructions', exact: true });
	}

	codeExamplePayload(text: string): Locator {
		return this.page.locator('code', { hasText: text });
	}

	get inputName(): Locator {
		return this.page.getByRole('textbox', { name: 'Name' });
	}

	get inputPostToChannel(): Locator {
		return this.page.getByRole('textbox', { name: 'Post to Channel' });
	}

	get inputPostAs(): Locator {
		return this.page.getByRole('textbox', { name: 'Post as' });
	}

	async selectPostAs(name: string) {
		await this.inputPostAs.click();
		await this.inputPostAs.fill('rocket.cat');
		await this.listbox.selectOption(name);
	}

	getIntegrationByName(name: string): Locator {
		return this.page.getByRole('table', { name: 'Integrations table' }).locator('tr', { hasText: name });
	}

	get inputWebhookUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Webhook URL' });
	}

	async deleteIntegrationByName(name: string) {
		await this.getIntegrationByName(name).click();
		await this.btnDelete.click();
		await this.deleteModal.confirmDelete();
	}
}
