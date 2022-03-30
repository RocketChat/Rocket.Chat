import { expect, Locator } from '@playwright/test';

import Pages from './Pages';
// import mainContent from './main-content.page';

class SideNav extends Pages {
	// New channel
	public channelType(): Locator {
		return this.page.locator('#modal-root .rcx-field:contains("Private") .rcx-toggle-switch__fake');
	}

	public channelReadOnly(): Locator {
		return this.page.locator('.create-channel__switches .rc-switch__button');
	}

	public channelName(): Locator {
		return this.page.locator('#modal-root [placeholder="Channel Name"]');
	}

	public saveChannelBtn(): Locator {
		return this.page.locator('#modal-root button:contains("Create")');
	}

	// Account box
	public getPopOverContent(): Locator {
		return this.page.locator('.rc-popover__content');
	}

	public accountBoxUserName(): Locator {
		return this.page.locator('.sidebar__account-username');
	}

	public accountBoxUserAvatar(): Locator {
		return this.page.locator('.sidebar__account .avatar-image');
	}

	public accountMenu(): Locator {
		return this.page.locator('.sidebar__account');
	}

	public sidebarHeader(): Locator {
		return this.page.locator('.sidebar__header');
	}

	public sidebarUserMenu(): Locator {
		return this.page.locator('[data-qa="sidebar-avatar-button"]');
	}

	public sidebarMenu(): Locator {
		return this.page.locator('.sidebar__toolbar-button-icon--menu');
	}

	public popOverContent(): Locator {
		return this.page.locator('.rc-popover__content');
	}

	public popOverHideOption(): Locator {
		return this.page.locator('.rcx-option__content:contains("Hide")');
	}

	public statusOnline(): Locator {
		return this.page.locator('.rcx-box--with-inline-elements:contains("online")');
	}

	public statusAway(): Locator {
		return this.page.locator('.rcx-box--with-inline-elements:contains("away")');
	}

	public statusBusy(): Locator {
		return this.page.locator('.rcx-box--with-inline-elements:contains("busy")');
	}

	public statusOffline(): Locator {
		return this.page.locator('.rcx-box--with-inline-elements:contains("offline")');
	}

	public account(): Locator {
		return this.page.locator('.rcx-option__content:contains("My Account")');
	}

	public admin(): Locator {
		return this.page.locator('.rcx-option__content:contains("Administration")');
	}

	public logout(): Locator {
		return this.page.locator('.rcx-option__content:contains("Logout")');
	}

	public sideNavBar(): Locator {
		return this.page.locator('.sidebar');
	}

	// Toolbar
	public spotlightSearchIcon(): Locator {
		return this.page.locator('[data-qa="sidebar-search"]');
	}

	public spotlightSearch(): Locator {
		return this.page.locator('[data-qa="sidebar-search-input"]');
	}

	public spotlightSearchPopUp(): Locator {
		return this.page.locator('[data-qa="sidebar-search-result"]');
	}

	public newChannelBtnToolbar(): Locator {
		return this.page.locator('[data-qa="sidebar-create"]');
	}

	public newChannelBtn(): Locator {
		return this.page.locator('.rcx-option__content:contains("Channel")');
	}

	public newDiscussionBtn(): Locator {
		return this.page.locator('.rcx-option__content:contains("Discussion")');
	}

	public newChannelIcon(): Locator {
		return this.page.locator('[data-qa="sidebar-create-channel"]');
	}

	// Rooms List
	public async general(): Promise<void> {
		return this.getChannelFromList('general');
	}

	public channelLeave(): Locator {
		return this.page.locator('.leave-room');
	}

	public channelHoverIcon(): Locator {
		return this.page.locator('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off');
	}

	// Account
	public preferences(): Locator {
		return this.page.locator('[href="/account/preferences"]');
	}

	public profile(): Locator {
		return this.page.locator('[href="/account/profile"]');
	}

	public avatar(): Locator {
		return this.page.locator('[href="/changeavatar"]');
	}

	public preferencesClose(): Locator {
		return this.page.locator('.flex-nav i.rcx-icon--name-cross');
	}

	public burgerBtn(): Locator {
		return this.page.locator('.burger, [aria-label="Open_menu"]');
	}

	public sidebarWrap(): Locator {
		return this.page.locator('.sidebar-wrap');
	}

	public firstSidebarItem(): Locator {
		return this.page.locator('.sidebar-item');
	}

	public firstSidebarItemMenu(): Locator {
		return this.page.locator('[data-qa=sidebar-avatar-button]');
	}

	public popoverOverlay(): Locator {
		return this.page.locator('.rc-popover.rc-popover--sidebar-item');
	}

	// Opens a channel via rooms list
	public async openChannel(channelName: any): Promise<void> {
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).scrollIntoViewIfNeeded();
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).click();
		await expect(this.page.locator('.rcx-room-header')).toContainText(channelName);
	}

	// Opens a channel via spotlight search
	public async searchChannel(channelName: any): Promise<void> {
		await this.spotlightSearch().should('be.visible');

		// Should have focus automatically, but some times it's not happening
		await this.spotlightSearch().click();

		await expect(this.spotlightSearch()).toBeFocused();
		await this.spotlightSearch().type(channelName);
		// cy.wait(500);

		// cy.get(
		// 	`[data-qa="sidebar-search-result"] .rcx-sidebar-item--clickable:contains("${channelName}"), [data-qa="sidebar-search-result"] .rcx-sidebar-item[aria-label='${channelName}']`,
		// ).click();

		await expect(this.page.locator('.rcx-room-header')).toContainText(channelName);
	}

	// Gets a channel from the rooms list
	public async getChannelFromList(channelName: any): Promise<void> {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: channelName }).scrollIntoViewIfNeeded();
	}

	public async createChannel(channelName: any, isPrivate: any /* isReadOnly*/): Promise<void> {
		await this.newChannelBtnToolbar().click();

		await this.newChannelBtn().click();

		if (!isPrivate) {
			await this.channelType().click();
		}

		await this.channelName().type(channelName);

		await expect(this.saveChannelBtn()).toBeEnabled();

		// if (isReadOnly) {
		// 	this.channelReadOnly.click();
		// }

		await this.saveChannelBtn().click();
		await expect(this.channelType()).not.toBeVisible();
		// mainContent.messageInput().should('be.focused');
	}
}

export default SideNav;
