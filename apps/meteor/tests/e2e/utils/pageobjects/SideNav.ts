import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';
import { ENTER } from '../mocks/keyboardKeyMock';

export default class SideNav extends BasePage {
	public channelType(): Locator {
		return this.getPage().locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	public channelName(): Locator {
		return this.getPage().locator('#modal-root [placeholder="Channel Name"]');
	}

	public saveChannelBtn(): Locator {
		return this.getPage().locator('//*[@id="modal-root"]//button[contains(text(), "Create")]');
	}

	public sidebarUserMenu(): Locator {
		return this.getPage().locator('[data-qa="sidebar-avatar-button"]');
	}

	public statusOnline(): Locator {
		return this.getPage().locator('(//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "online")])[1]');
	}

	public statusAway(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "away")]');
	}

	public statusBusy(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "busy")]');
	}

	public statusOffline(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-box--with-inline-elements") and contains(text(), "offline")]');
	}

	public account(): Locator {
		return this.getPage().locator('//li[@class="rcx-option"]//div[contains(text(), "My Account")]');
	}

	public admin(): Locator {
		return this.getPage().locator('//li[@class="rcx-option"]//div[contains(text(), "Administration")]');
	}

	public omnichannel(): Locator {
		return this.getPage().locator('li.rcx-option >> text="Omnichannel"');
	}

	get users(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/users"]');
	}

	public logout(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]');
	}

	public sideNavBar(): Locator {
		return this.getPage().locator('.sidebar');
	}

	public flexNav(): Locator {
		return this.getPage().locator('.flex-nav');
	}

	public spotlightSearchIcon(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search"]');
	}

	public spotlightSearch(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search-input"]');
	}

	public spotlightSearchPopUp(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search-result"]');
	}

	public newChannelBtnToolbar(): Locator {
		return this.getPage().locator('[data-qa="sidebar-create"]');
	}

	public newChannelBtn(): Locator {
		return this.getPage().locator('li.rcx-option >> text="Channel"');
	}

	public general(): Locator {
		return this.getChannelFromList('general');
	}

	public preferences(): Locator {
		return this.getPage().locator('[href="/account/preferences"]');
	}

	public profile(): Locator {
		return this.getPage().locator('[href="/account/profile"]');
	}

	public preferencesClose(): Locator {
		return this.getPage().locator('//*[contains(@class,"flex-nav")]//i[contains(@class, "rcx-icon--name-cross")]');
	}

	public burgerBtn(): Locator {
		return this.getPage().locator('[data-qa-id="burger-menu"]');
	}

	public firstSidebarItemMenu(): Locator {
		return this.getPage().locator('[data-qa=sidebar-avatar-button]');
	}

	public returnToMenuInLowResolution(): Locator {
		return this.getPage().locator('//button[@aria-label="Close menu"]');
	}

	public async isSideBarOpen(): Promise<boolean> {
		return !!(await this.sideNavBar().getAttribute('style'));
	}

	public async openChannel(channelName: string): Promise<void> {
		await this.getPage().locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).scrollIntoViewIfNeeded();
		await this.getPage().locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).click();
		await expect(this.getPage().locator('.rcx-room-header')).toContainText(channelName);
	}

	public async searchChannel(channelName: string): Promise<void> {
		await expect(this.spotlightSearch()).toBeVisible();

		await this.spotlightSearch().click();

		await expect(this.spotlightSearch()).toBeFocused();
		await this.spotlightSearch().type(channelName);

		await expect(this.getPage().locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).first()).toContainText(channelName);

		await this.spotlightSearchPopUp().click();
	}

	public getChannelFromList(channelName: any): Locator {
		return this.getPage().locator('[data-qa="sidebar-item-title"]', { hasText: channelName });
	}

	private searchUser(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search"]');
	}

	private searchInput(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search-input"]');
	}

	public async createChannel(channelName: any, isPrivate: any /* isReadOnly*/): Promise<void> {
		await this.newChannelBtnToolbar().click();

		await this.newChannelBtn().click();

		if (!isPrivate) {
			await this.channelType().click();
		}

		await this.channelName().type(channelName);

		await expect(this.saveChannelBtn()).toBeEnabled();

		await this.saveChannelBtn().click();
		await expect(this.channelType()).not.toBeVisible();
	}

	public async findForChat(target: string): Promise<void> {
		await this.searchUser().click();
		await this.searchInput().type(target, { delay: 100 });
		await this.getPage().keyboard.press(ENTER);
	}

	public async doLogout(): Promise<void> {
		await this.getPage().goto('/home');
		await this.sidebarUserMenu().click();
		await this.logout().click();
	}
}
