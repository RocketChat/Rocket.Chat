import Page from './Page';

class SideNav extends Page {
	// New channel
	get channelType() { return browser.element('.create-channel__content .rc-switch__button'); }

	get channelReadOnly() { return browser.elements('.create-channel__switches .rc-switch__button').value[1]; }

	get channelName() { return browser.element('.create-channel__content input[name="name"]'); }

	get saveChannelBtn() { return browser.element('.rc-modal__content [data-button="create"]'); }

	// Account box
	getPopOverContent() { return browser.element('.rc-popover__content'); }

	get accountBoxUserName() { return browser.element('.sidebar__account-username'); }

	get accountBoxUserAvatar() { return browser.element('.sidebar__account .avatar-image'); }

	get accountMenu() { return browser.element('.sidebar__account'); }

	get sidebarHeader() { return browser.element('.sidebar__header'); }

	get sidebarUserMenu() { return browser.element('.sidebar__header .avatar'); }

	get sidebarMenu() { return browser.element('.sidebar__toolbar-button-icon--menu'); }

	get popOverContent() { return browser.element('.rc-popover__content'); }

	get statusOnline() { return browser.element('.rc-popover__item--online'); }

	get statusAway() { return browser.element('.rc-popover__item--away'); }

	get statusBusy() { return browser.element('.rc-popover__item--busy'); }

	get statusOffline() { return browser.element('.rc-popover__item--offline'); }

	get account() { return browser.element('[data-id="account"][data-type="open"]'); }

	get admin() { return browser.element('[data-id="administration"][data-type="open"]'); }

	get logout() { return browser.element('[data-id="logout"][data-type="open"]'); }

	get sideNavBar() { return browser.element('.sidebar'); }

	// Toolbar
	get spotlightSearchIcon() { return browser.element('.sidebar__toolbar-button-icon--magnifier'); }

	get spotlightSearch() { return browser.element('.toolbar__search input'); }

	get spotlightSearchPopUp() { return browser.element('.rooms-list__toolbar-search'); }

	get newChannelBtnToolbar() { return browser.element('.sidebar__toolbar-button-icon--edit-rounded'); }

	get newChannelBtn() { return browser.element('.rc-popover__icon-element--hashtag'); }

	get newDiscussionBtn() { return browser.element('.rc-popover__icon-element--discussion'); }

	get newChannelIcon() { return browser.element('.toolbar__icon.toolbar__search-create-channel'); }

	// Rooms List
	get general() { return this.getChannelFromList('general'); }

	get channelLeave() { return browser.element('.leave-room'); }

	get channelHoverIcon() { return browser.element('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off'); }

	get moreChannels() { return browser.element('.rooms-list .more-channels'); }

	// Account
	get preferences() { return browser.element('[href="/account/preferences"]'); }

	get profile() { return browser.element('[href="/account/profile"]'); }

	get avatar() { return browser.element('[href="/changeavatar"]'); }

	get preferencesClose() { return browser.element('.sidebar-flex__close-button[data-action="close"]'); }

	get burgerBtn() { return browser.element('.burger'); }

	get sidebarWrap() { return browser.element('.sidebar-wrap'); }

	get firstSidebarItem() { return browser.element('.sidebar-item'); }

	get firstSidebarItemMenu() { return browser.element('.sidebar-item__menu'); }

	get popoverOverlay() { return browser.element('.rc-popover.rc-popover--sidebar-item'); }

	// Opens a channel via rooms list
	openChannel(channelName) {
		cy.get('.sidebar-item__ellipsis').contains(channelName).scrollIntoView().click();
		cy.get('.rc-header__name').should('contain', channelName);
	}

	// Opens a channel via spotlight search
	searchChannel(channelName) {
		// browser.waitForVisible('.rc-header', 15000);
		// if (browser.isVisible('.rc-header__name')) {
		// 	if (channelName === browser.element('.rc-header__name').getText()) {
		// 		return;
		// 	}
		// }
		// this.spotlightSearch.waitForVisible(5000);
		// TODO: handle the case where the channel is already there
		this.spotlightSearch.click();
		this.spotlightSearch.type(channelName);

		cy.get(`[aria-label='${ channelName }']`).click({ multiple: true });

		cy.get('.rc-header__name').should('contain', channelName);
	}

	// Gets a channel from the spotlight search
	getChannelFromSpotlight(channelName) {
		let currentRoom;
		// browser.waitForVisible('.rc-header', 15000);
		if (browser.isVisible('.rc-header__name')) {
			currentRoom = browser.element('.rc-header__name').getText();
		}
		currentRoom = browser.element('.rc-header__name').getText();
		console.log(currentRoom, channelName);
		if (currentRoom !== channelName) {
			// this.spotlightSearch.waitForVisible(5000);
			this.spotlightSearch.click();
			this.spotlightSearch.setValue(channelName);
			// browser.waitForVisible(`.sidebar-item__name=${ channelName }`, 5000);
			return browser.element(`.sidebar-item__name=${ channelName }`);
		}
	}

	// Gets a channel from the rooms list
	getChannelFromList(channelName, reverse) {
		if (reverse == null) {
			// browser.waitForVisible(`.sidebar-item__name=${ channelName }`, 5000);
		}
		return cy.get('.sidebar-item__name').contains(channelName);
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
	}
}

module.exports = new SideNav();
