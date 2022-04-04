import Page from './Page';
import mainContent from './main-content.page';

class SideNav extends Page {
	// New channel
	get channelType() {
		return browser.element('#modal-root .rcx-field:contains("Private") .rcx-toggle-switch__fake');
	}

	get channelReadOnly() {
		return browser.elements('.create-channel__switches .rc-switch__button').value[1];
	}

	get channelName() {
		return browser.element('#modal-root [placeholder="Channel Name"]');
	}

	get saveChannelBtn() {
		return browser.element('#modal-root button:contains("Create")');
	}

	// Account box
	getPopOverContent() {
		return browser.element('.rc-popover__content');
	}

	get accountBoxUserName() {
		return browser.element('.sidebar__account-username');
	}

	get accountBoxUserAvatar() {
		return browser.element('.sidebar__account .avatar-image');
	}

	get accountMenu() {
		return browser.element('.sidebar__account');
	}

	get sidebarHeader() {
		return browser.element('.sidebar__header');
	}

	get sidebarUserMenu() {
		return browser.element('[data-qa="sidebar-avatar-button"]');
	}

	get sidebarMenu() {
		return browser.element('.sidebar__toolbar-button-icon--menu');
	}

	get popOverContent() {
		return browser.element('.rc-popover__content');
	}

	get popOverHideOption() {
		return browser.element('.rcx-option__content:contains("Hide")');
	}

	get statusOnline() {
		return browser.element('.rcx-box--with-inline-elements:contains("online")');
	}

	get statusAway() {
		return browser.element('.rcx-box--with-inline-elements:contains("away")');
	}

	get statusBusy() {
		return browser.element('.rcx-box--with-inline-elements:contains("busy")');
	}

	get statusOffline() {
		return browser.element('.rcx-box--with-inline-elements:contains("offline")');
	}

	get account() {
		return browser.element('.rcx-option__content:contains("My Account")');
	}

	get admin() {
		return browser.element('.rcx-option__content:contains("Administration")');
	}

	get logout() {
		return browser.element('.rcx-option__content:contains("Logout")');
	}

	get sideNavBar() {
		return browser.element('.sidebar');
	}

	// Toolbar
	get spotlightSearchIcon() {
		return browser.element('[data-qa="sidebar-search"]');
	}

	get spotlightSearch() {
		return browser.element('[data-qa="sidebar-search-input"]');
	}

	get spotlightSearchPopUp() {
		return browser.element('[data-qa="sidebar-search-result"]');
	}

	get newChannelBtnToolbar() {
		return browser.element('[data-qa="sidebar-create"]');
	}

	get newChannelBtn() {
		return browser.element('.rcx-option__content:contains("Channel")');
	}

	get newDiscussionBtn() {
		return browser.element('.rcx-option__content:contains("Discussion")');
	}

	get newChannelIcon() {
		return browser.element('[data-qa="sidebar-create-channel"]');
	}

	// Rooms List
	get general() {
		return this.getChannelFromList('general');
	}

	get channelLeave() {
		return browser.element('.leave-room');
	}

	get channelHoverIcon() {
		return browser.element('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off');
	}

	// Account
	get preferences() {
		return browser.element('[href="/account/preferences"]');
	}

	get profile() {
		return browser.element('[href="/account/profile"]');
	}

	get avatar() {
		return browser.element('[href="/changeavatar"]');
	}

	get preferencesClose() {
		return browser.element('.flex-nav i.rcx-icon--name-cross');
	}

	get burgerBtn() {
		return browser.element('.burger, [aria-label="Open_menu"]');
	}

	get sidebarWrap() {
		return browser.element('.sidebar-wrap');
	}

	get firstSidebarItem() {
		return browser.element('.sidebar-item');
	}

	get firstSidebarItemMenu() {
		return browser.element('[data-qa=sidebar-avatar-button]');
	}

	get popoverOverlay() {
		return browser.element('.rc-popover.rc-popover--sidebar-item');
	}

	// Opens a channel via rooms list
	openChannel(channelName) {
		cy.contains('[data-qa="sidebar-item-title"]', channelName).scrollIntoView().click();
		cy.get('.rcx-room-header').should('contain', channelName);
	}

	// Opens a channel via spotlight search
	searchChannel(channelName) {
		this.spotlightSearch.should('be.visible');

		// Should have focus automatically, but some times it's not happening
		this.spotlightSearch.click();

		this.spotlightSearch.should('have.focus');
		this.spotlightSearch.type(channelName);
		cy.wait(500);

		cy.get(
			`[data-qa="sidebar-search-result"] .rcx-sidebar-item--clickable:contains("${channelName}"), [data-qa="sidebar-search-result"] .rcx-sidebar-item[aria-label='${channelName}']`,
		).click();

		cy.get('.rcx-room-header').should('contain', channelName);
	}

	// Gets a channel from the rooms list
	getChannelFromList(channelName) {
		return cy.contains('[data-qa="sidebar-item-title"]', channelName).scrollIntoView();
	}

	createChannel(channelName, isPrivate /* isReadOnly*/) {
		this.newChannelBtnToolbar.click();

		this.newChannelBtn.click();

		if (!isPrivate) {
			this.channelType.click({ multiple: true });
		}

		this.channelName.type(channelName);

		this.saveChannelBtn.should('be.enabled');

		// if (isReadOnly) {
		// 	this.channelReadOnly.click();
		// }

		this.saveChannelBtn.click();
		this.channelType.should('not.exist');
		mainContent.messageInput.should('be.focused');
	}
}

export default new SideNav();
