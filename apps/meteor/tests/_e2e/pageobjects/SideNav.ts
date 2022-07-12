import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class SideNav extends BasePage {
	get channelType(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	get channelName(): Locator {
		return this.page.locator('#modal-root [placeholder="Channel Name"]');
	}

	get sidebarUserMenu(): Locator {
		return this.page.locator('[data-qa="sidebar-avatar-button"]');
	}

	get statusOnline(): Locator {
		return this.page.locator('(//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "online")])[1]');
	}

	get statusAway(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "away")]');
	}

	get statusBusy(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "busy")]');
	}

	get statusOffline(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "offline")]');
	}

	get account(): Locator {
		return this.page.locator('//li[@class="rcx-option"]//div[contains(text(), "My Account")]');
	}

	get admin(): Locator {
		return this.page.locator('//li[@class="rcx-option"]//div[contains(text(), "Administration")]');
	}

	get omnichannel(): Locator {
		return this.page.locator('li.rcx-option >> text="Omnichannel"');
	}

	get users(): Locator {
		return this.page.locator('.flex-nav [href="/admin/users"]');
	}

	get logout(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]');
	}

	get sideNavBar(): Locator {
		return this.page.locator('.sidebar');
	}

	get flexNav(): Locator {
		return this.page.locator('.flex-nav');
	}

	get spotlightSearchIcon(): Locator {
		return this.page.locator('[data-qa="sidebar-search"]');
	}

	get spotlightSearch(): Locator {
		return this.page.locator('[data-qa="sidebar-search-input"]');
	}

	get spotlightSearchPopUp(): Locator {
		return this.page.locator('[data-qa="sidebar-search-result"]');
	}

	get btnSidebarCreate(): Locator {
		return this.page.locator('[data-qa="sidebar-create"]');
	}

	get newChannelBtn(): Locator {
		return this.page.locator('li.rcx-option >> text="Channel"');
	}

	get general(): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: 'general' });
	}

	get preferences(): Locator {
		return this.page.locator('[href="/account/preferences"]');
	}

	get profile(): Locator {
		return this.page.locator('[href="/account/profile"]');
	}

	get preferencesClose(): Locator {
		return this.page.locator('//*[contains(@class,"flex-nav")]//i[contains(@class, "rcx-icon--name-cross")]');
	}

	get burgerBtn(): Locator {
		return this.page.locator('[data-qa-id="burger-menu"]');
	}

	get firstSidebarItemMenu(): Locator {
		return this.page.locator('[data-qa=sidebar-avatar-button]');
	}

	get returnToMenuInLowResolution(): Locator {
		return this.page.locator('//button[@aria-label="Close menu"]');
	}

	async isSideBarOpen(): Promise<boolean> {
		return !!(await this.sideNavBar.getAttribute('style'));
	}

	async doOpenChat(name: string): Promise<void> {
		await expect(this.page.locator('[data-qa="sidebar-search"]')).toBeVisible();

		await this.page.locator('[data-qa="sidebar-search"]').click();
		await this.page.locator('[data-qa="sidebar-search-input"]').type(name);
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: name }).first().click();
	}

	async doCreateChannel(channelName: string, isPrivate = false): Promise<void> {
		await this.page.locator('[data-qa="sidebar-create"]').click();
		await this.page.locator('li.rcx-option >> text="Channel"').click();

		if (!isPrivate) {
			await this.channelType.click();
		}

		await this.channelName.type(channelName);
		await this.page.locator('//*[@id="modal-root"]//button[contains(text(), "Create")]').click();
	}

	async doLogout(): Promise<void> {
		await this.page.goto('/home');
		await this.sidebarUserMenu.click();
		await this.logout.click();
	}
}
