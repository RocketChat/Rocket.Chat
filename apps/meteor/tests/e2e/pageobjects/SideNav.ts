import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';
import { ENTER } from '../utils/mocks/keyboardKeyMock';

export class SideNav extends BasePage {
	get channelType(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	get channelName(): Locator {
		return this.page.locator('#modal-root [placeholder="Channel Name"]');
	}

	get saveChannelBtn(): Locator {
		return this.page.locator('//*[@id="modal-root"]//button[contains(text(), "Create")]');
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

	get newChannelBtnToolbar(): Locator {
		return this.page.locator('[data-qa="sidebar-create"]');
	}

	get newChannelBtn(): Locator {
		return this.page.locator('li.rcx-option >> text="Channel"');
	}

	get general(): Locator {
		return this.getChannelFromList('general');
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

	public async isSideBarOpen(): Promise<boolean> {
		return !!(await this.sideNavBar.getAttribute('style'));
	}

	public async openChannel(channelName: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).scrollIntoViewIfNeeded();
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).click();
		await expect(this.page.locator('.rcx-room-header')).toContainText(channelName);
	}

	public async searchChannel(channelName: string): Promise<void> {
		await expect(this.spotlightSearch).toBeVisible();

		await this.spotlightSearch.click();

		await expect(this.spotlightSearch).toBeFocused();
		await this.spotlightSearch.type(channelName);

		await expect(this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).first()).toContainText(channelName);

		await this.spotlightSearchPopUp.click();
	}

	public getChannelFromList(channelName: any): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName });
	}

	get searchUser(): Locator {
		return this.page.locator('[data-qa="sidebar-search"]');
	}

	get searchInput(): Locator {
		return this.page.locator('[data-qa="sidebar-search-input"]');
	}

	public async createChannel(channelName: any, isPrivate: any /* isReadOnly*/): Promise<void> {
		await this.newChannelBtnToolbar.click();

		await this.newChannelBtn.click();

		if (!isPrivate) {
			await this.channelType.click();
		}

		await this.channelName.type(channelName);

		await expect(this.saveChannelBtn).toBeEnabled();

		await this.saveChannelBtn.click();
		await expect(this.channelType).not.toBeVisible();
	}

	public async findForChat(target: string): Promise<void> {
		await this.searchUser.click();
		await this.searchInput.type(target, { delay: 100 });
		await this.page.keyboard.press(ENTER);
	}

	public async doLogout(): Promise<void> {
		await this.page.goto('/home');
		await this.sidebarUserMenu.click();
		await this.logout.click();
	}
}
