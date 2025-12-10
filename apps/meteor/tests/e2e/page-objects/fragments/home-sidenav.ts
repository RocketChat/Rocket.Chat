import type { Locator, Page } from '@playwright/test';

import { LoginPage } from '../login';

export class HomeSidenav {
	private readonly page: Page;

	private readonly login: LoginPage;

	constructor(page: Page) {
		this.page = page;
		this.login = new LoginPage(page);
	}

	get advancedSettingsAccordion(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Advanced settings', exact: true });
	}

	get checkboxPrivateChannel(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Private' }) });
	}

	get checkboxEncryption(): Locator {
		return this.page.locator('role=dialog[name="Create channel"] >> label >> text="Encrypted"');
	}

	get checkboxReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}

	get inputChannelName(): Locator {
		return this.page.locator('#modal-root [data-qa="create-channel-modal"] [data-qa-type="channel-name-input"]');
	}

	get inputDirectUsername(): Locator {
		return this.page.locator('#modal-root [data-qa="create-direct-modal"] [data-qa-type="user-auto-complete-input"]');
	}

	get btnCreate(): Locator {
		return this.page.locator('role=button[name="Create"]');
	}

	get inputSearch(): Locator {
		return this.page.locator('role=search >> role=searchbox').first();
	}

	get sidebarChannelsList(): Locator {
		return this.page.getByRole('list', { name: 'Channels' });
	}

	get sidebarToolbar(): Locator {
		return this.page.getByRole('toolbar', { name: 'Sidebar actions' });
	}

	// Note: this is different from openChat because queued chats are not searchable
	getQueuedChat(name: string): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: new RegExp(`^${name}$`) }).first();
	}

	getSidebarItemByName(name: string): Locator {
		return this.page.getByRole('link').filter({ has: this.page.getByText(name, { exact: true }) });
	}

	getSidebarListItemByName(name: string): Locator {
		return this.sidebarChannelsList.getByRole('listitem').filter({ has: this.getSidebarItemByName(name) });
	}

	async selectPriority(name: string, priority: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.focus();
		await sidebarItem.locator('.rcx-sidebar-item__menu').click();
		await this.page.getByRole('menuitem', { name: priority }).click();
	}

	async waitForHome(): Promise<void> {
		await this.page.waitForSelector('main');
	}

	get homepageHeader(): Locator {
		return this.page.locator('main').getByRole('heading', { name: 'Home' });
	}
}
