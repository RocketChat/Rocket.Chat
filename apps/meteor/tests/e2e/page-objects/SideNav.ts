import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';
import { ENTER } from '../utils/mocks/keyboardKeyMock';

export class SideNav extends BasePage {
	get channelType(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	get channelReadOnly(): Locator {
		return this.page.locator('.create-channel__switches .rc-switch__button');
	}

	get textChannelName(): Locator {
		return this.page.locator('#modal-root [placeholder="Channel Name"]');
	}

	get btnSaveChannel(): Locator {
		return this.page.locator('//*[@id="modal-root"]//button[contains(text(), "Create")]');
	}

	get getPopOverContent(): Locator {
		return this.page.locator('.rc-popover__content');
	}

	get accountBoxUserName(): Locator {
		return this.page.locator('.sidebar__account-username');
	}

	get accountBoxUserAvatar(): Locator {
		return this.page.locator('.sidebar__account .avatar-image');
	}

	get accountMenu(): Locator {
		return this.page.locator('.sidebar__account');
	}

	get sidebarHeader(): Locator {
		return this.page.locator('.sidebar__header');
	}

	get sidebarUserMenu(): Locator {
		return this.page.locator('[data-qa="sidebar-avatar-button"]');
	}

	get sidebarMenu(): Locator {
		return this.page.locator('.sidebar__toolbar-button-icon--menu');
	}

	get popOverContent(): Locator {
		return this.page.locator('.rc-popover__content');
	}

	get popOverHideOption(): Locator {
		return this.page.locator('.rcx-option__content:contains("Hide")');
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

	get logout(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]');
	}

	get sideNavBar(): Locator {
		return this.page.locator('.sidebar');
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

	get btnNewChannel(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content")]', { hasText: 'Channel' });
	}

	get general(): Locator {
		return this.getChannelFromList('general');
	}

	get channelLeave(): Locator {
		return this.page.locator('.leave-room');
	}

	get channelHoverIcon(): Locator {
		return this.page.locator('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off');
	}

	get preferences(): Locator {
		return this.page.locator('[href="/account/preferences"]');
	}

	get profile(): Locator {
		return this.page.locator('[href="/account/profile"]');
	}

	get avatar(): Locator {
		return this.page.locator('[href="/changeavatar"]');
	}

	get preferencesClose(): Locator {
		return this.page.locator('//*[contains(@class,"flex-nav")]//i[contains(@class, "rcx-icon--name-cross")]');
	}

	get btnBurger(): Locator {
		return this.page.locator('.burger, [aria-label="Open_menu"]');
	}

	get sidebarWrap(): Locator {
		return this.page.locator('.sidebar-wrap');
	}

	get firstSidebarItem(): Locator {
		return this.page.locator('.sidebar-item');
	}

	get firstSidebarItemMenu(): Locator {
		return this.page.locator('[data-qa=sidebar-avatar-button]');
	}

	get popoverOverlay(): Locator {
		return this.page.locator('.rc-popover.rc-popover--sidebar-item');
	}

	get returnToMenuInLowResolution(): Locator {
		return this.page.locator('//button[@aria-label="Close menu"]');
	}

	async isSideBarOpen(): Promise<boolean> {
		return !!(await this.sideNavBar.getAttribute('style'));
	}

	async doOpenChannel(channelName: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).scrollIntoViewIfNeeded();
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).click();
		await expect(this.page.locator('.rcx-room-header')).toContainText(channelName);
	}

	async searchChannel(channelName: string): Promise<void> {
		await expect(this.spotlightSearch).toBeVisible();

		await this.spotlightSearch.click();

		await expect(this.spotlightSearch).toBeFocused();
		await this.spotlightSearch.type(channelName);

		await expect(this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).first()).toContainText(channelName);

		await this.spotlightSearchPopUp.click();
	}

	async searchChannelAndOpen(channelName: string): Promise<void> {
		await this.searchChannel(channelName);
	}

	getChannelFromList(channelName: string): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName });
	}

	private get searchUser(): Locator {
		return this.page.locator('[data-qa="sidebar-search"]');
	}

	async doCreateChannel(channelName: string, isPrivate: boolean): Promise<void> {
		await this.newChannelBtnToolbar.click();

		await this.btnNewChannel.click();

		if (!isPrivate) {
			await this.channelType.click();
		}

		await this.textChannelName.type(channelName);

		await expect(this.btnSaveChannel).toBeEnabled();

		await this.btnSaveChannel.click();
		await expect(this.channelType).not.toBeVisible();
	}

	async doFindForChat(target: string): Promise<void> {
		await this.searchUser.click();
		await this.spotlightSearch.type(target, { delay: 300 });
		await this.page.keyboard.press(ENTER);
	}

	async doLogout(): Promise<void> {
		await this.page.goto('/home');
		await this.sidebarUserMenu.click();
		await this.logout.click();
	}
}
