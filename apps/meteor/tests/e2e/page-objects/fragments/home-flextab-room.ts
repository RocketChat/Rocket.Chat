import type { Locator, Page } from '@playwright/test';

export class HomeFlextabRoom {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get btnLeave(): Locator {
		return this.page.locator('role=button[name="Leave"]');
	}

	get btnMore(): Locator {
		return this.page.locator('role=button[name="More"]');
	}

	getMoreOption(option: string) {
		return this.page.locator(`role=menuitem[name="${option}"]`);
	}

	get confirmLeaveModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Confirmation', exact: true });
	}

	async confirmLeave() {
		return this.confirmLeaveModal.getByRole('button', { name: 'Leave', exact: true }).click();
	}

	get confirmDeleteTeamModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Delete team', exact: true });
	}

	async confirmDeleteTeam() {
		return this.confirmDeleteTeamModal.getByRole('button', { name: 'Yes, delete', exact: true }).click();
	}

	get confirmConvertModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Confirmation', exact: true });
	}

	async confirmConvert() {
		return this.confirmConvertModal.getByRole('button', { name: 'Convert', exact: true }).click();
	}

	get optionDelete(): Locator {
		return this.page.locator('label[data-key="delete"]');
	}

	get inputName(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Name' });
	}

	get inputTopic(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Topic' });
	}

	get inputAnnouncement(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Announcement' });
	}

	get inputDescription(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Description' });
	}

	get checkboxReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}

	get checkboxEncrypted(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Encrypted' }) });
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get calloutRetentionPolicy(): Locator {
		return this.page.getByRole('dialog').getByRole('alert', { name: 'Retention policy warning callout' });
	}

	get advancedSettingsAccordion(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Advanced settings' });
	}

	get pruneAccordion(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Prune', exact: true });
	}

	getMaxAgeLabel(maxAge = '30') {
		return this.page.getByRole('dialog').getByText(`Maximum message age in days (default: ${maxAge})`);
	}

	get inputRetentionMaxAge(): Locator {
		return this.page.getByRole('dialog').locator('input[name="retentionMaxAge"]');
	}

	get checkboxPruneMessages(): Locator {
		return this.page
			.getByRole('dialog')
			.locator('label', { has: this.page.getByRole('checkbox', { name: 'Automatically prune old messages' }) });
	}

	get checkboxOverrideGlobalRetention(): Locator {
		return this.page
			.getByRole('dialog')
			.locator('label', { has: this.page.getByRole('checkbox', { name: 'Override global retention policy' }) });
	}

	get checkboxIgnoreThreads(): Locator {
		return this.page.getByRole('dialog').locator('label', { has: this.page.getByRole('checkbox', { name: 'Do not prune Threads' }) });
	}

	get checkboxChannels(): Locator {
		return this.page.getByRole('dialog').locator('label', { has: this.page.getByRole('checkbox', { name: 'Channels' }) });
	}

	get checkboxDiscussions(): Locator {
		return this.page.getByRole('dialog').locator('label', { has: this.page.getByRole('checkbox', { name: 'Discussions' }) });
	}

	async toggleSidepanelItems() {
		await this.checkboxChannels.click();
		await this.checkboxDiscussions.click();
	}
}
