import type { Locator, Page } from '@playwright/test';

export class HomeFlextabChannels {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get channelsTab(): Locator {
		return this.page.getByRole('dialog', { exact: true });
	}

	get btnAddExisting(): Locator {
		return this.page.locator('button >> text="Add Existing"');
	}

	get btnCreateNew(): Locator {
		return this.page.locator('button >> text="Create new"');
	}

	get inputChannels(): Locator {
		return this.page.locator('#modal-root input').first();
	}

	get btnAdd(): Locator {
		return this.page.locator('role=dialog >> role=group >> role=button[name=Add]');
	}

	get channelsList(): Locator {
		return this.channelsTab.getByRole('list');
	}

	get emptyChannelsList(): Locator {
		return this.channelsTab.getByRole('heading', { name: 'No Channels on this Team' });
	}

	channelOption(name: string) {
		return this.channelsTab.locator('li', { hasText: name });
	}

	async waitForList() {
		await this.channelsList.waitFor();
	}

	async openChannelOptionMoreActions(name: string) {
		await this.waitForList();
		await this.channelOption(name).hover();
		await this.channelOption(name).locator('role=button[name="More"]').click();
	}

	async confirmRemoveChannel() {
		return this.page
			.getByRole('dialog', { name: 'Are you sure?', exact: true })
			.getByRole('button', { name: 'Remove', exact: true })
			.click();
	}

	async confirmDeleteRoom() {
		return this.page.getByRole('button', { name: 'Yes, delete', exact: true }).click();
	}
}
