import type { Locator, Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';

export class AdminIntegrations extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get btnInstructions(): Locator {
		return this.page.getByRole('button', { name: 'Instructions', exact: true });
	}

	protected readonly route = AdminSectionsHref.integrations;

	protected readonly title = 'Integrations';

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
