import Page from './Page';
import mainContent from './main-content.page';

class SideNav extends Page {
	// New channel
	get channelType() { return browser.element('.create-channel__content [name=type]~.rc-switch__button'); }

	get channelReadOnly() { return browser.elements('.create-channel__switches .rc-switch__button').value[1]; }

	get channelName() { return browser.element('.create-channel__content input[name="name"]'); }

	get saveChannelBtn() { return browser.element('.rc-modal__content [data-button="create"]'); }

	// Account box
	getPopOverContent() { return browser.element('.rc-popover__content'); }

	get accountBoxUserName() { return browser.element('.sidebar__account-username'); }

	get accountBoxUserAvatar() { return browser.element('.sidebar__account .avatar-image'); }

	get accountMenu() { return browser.element('.sidebar__account'); }

	get sidebarHeader() { return browser.element('.sidebar__header'); }

	get sidebarUserMenu() { return browser.element('[data-qa="sidebar-avatar-button"]'); }

	get sidebarMenu() { return browser.element('.sidebar__toolbar-button-icon--menu'); }

	get popOverContent() { return browser.element('.rc-popover__content'); }

	get popOverHideOption() { return browser.element('.rc-popover__content [data-id="hide"][data-type="sidebar-item"]'); }

	get statusOnline() { return browser.element('.rc-popover__item--online'); }

	get statusAway() { return browser.element('.rc-popover__item--away'); }

	get statusBusy() { return browser.element('.rc-popover__item--busy'); }

	get statusOffline() { return browser.element('.rc-popover__item--offline'); }

	get account() { return browser.element('[data-id="account"][data-type="open"]'); }

	get admin() { return browser.element('[data-id="administration"][data-type="open"]'); }

	get logout() { return browser.element('[data-id="logout"][data-type="open"]'); }

	get sideNavBar() { return browser.element('.sidebar'); }

	// Toolbar
	get spotlightSearchIcon() { return browser.element('[data-qa="sidebar-search"]'); }

	get spotlightSearch() { return browser.element('[data-qa="sidebar-search-input"]'); }

	get spotlightSearchPopUp() { return browser.element('[data-qa="sidebar-search-result"]'); }

	get newChannelBtnToolbar() { return browser.element('[data-qa="sidebar-create"]'); }

	get newChannelBtn() { return browser.element('[data-qa="sidebar-create-dm"]'); }

	get newDiscussionBtn() { return browser.element('[data-qa="sidebar-create-discussion"]'); }

	get newChannelIcon() { return browser.element('[data-qa="sidebar-create-channel"]'); }

	// Rooms List
	get general() { return this.getChannelFromList('general'); }

	get channelLeave() { return browser.element('.leave-room'); }

	get channelHoverIcon() { return browser.element('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off'); }

	// Account
	get preferences() { return browser.element('[href="/account/preferences"]'); }

	get profile() { return browser.element('[href="/account/profile"]'); }

	get avatar() { return browser.element('[href="/changeavatar"]'); }

	get preferencesClose() { return browser.element('.sidebar-flex__close-button[data-action="close"]'); }

	get burgerBtn() { return browser.element('.burger'); }

	get sidebarWrap() { return browser.element('.sidebar-wrap'); }

	get firstSidebarItem() { return browser.element('.sidebar-item'); }

	get firstSidebarItemMenu() { return browser.element('.sidebar-item:first-child .sidebar-item__menu'); }

	get popoverOverlay() { return browser.element('.rc-popover.rc-popover--sidebar-item'); }

	// Opens a channel via rooms list
	openChannel(channelName) {
		cy.contains('[data-qa="sidebar-item-title"]', channelName).scrollIntoView().click();
		cy.get('.rc-header__name').should('contain', channelName);
	}

	// Opens a channel via spotlight search
	searchChannel(channelName) {
		this.spotlightSearch.should('be.visible');
		this.spotlightSearch.should('have.focus');
		this.spotlightSearch.type(channelName);
		cy.wait(500);

		cy.get(`[data-qa='sidebar-item'][aria-label='${ channelName }']:first-child`).click();

		cy.get('.rc-header__name').should('contain', channelName);
	}

	// Gets a channel from the rooms list
	getChannelFromList(channelName) {
		return cy.get('[data-qa="sidebar-item-title"]').contains(channelName);
	}

	createChannel(channelName, isPrivate /* isReadOnly*/) {
		this.newChannelBtnToolbar.click();

		this.newChannelBtn.click();

		if (!isPrivate) {
			this.channelType.click({ multiple: true });
		}

		this.channelName.type(channelName);

		cy.get('.rc-modal__content [data-button="create"]').should('be.enabled');

		// if (isReadOnly) {
		// 	this.channelReadOnly.click();
		// }

		this.saveChannelBtn.click();
		this.channelType.should('not.be.visible');
		mainContent.messageInput.should('be.focused');
	}
}

module.exports = new SideNav();
