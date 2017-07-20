import Page from './Page';

class SideNav extends Page {
	// New channel
	get channelType() { return browser.element('label[for="channel-type"]'); }
	get channelReadOnly() { return browser.element('label[for="channel-ro"]'); }
	get channelName() { return browser.element('input#channel-name'); }
	get saveChannelBtn() { return browser.element('.save-channel'); }

	// Account box
	get accountBoxUserName() { return browser.element('.account-box .data h4'); }
	get accountBoxUserAvatar() { return browser.element('.account-box .avatar-image'); }
	get userOptions() { return browser.element('.options'); }
	get statusOnline() { return browser.element('.online'); }
	get statusAway() { return browser.element('.away'); }
	get statusBusy() { return browser.element('.busy'); }
	get statusOffline() { return browser.element('.offline'); }
	get account() { return browser.element('#account'); }
	get admin() { return browser.element('#admin'); }
	get logout() { return browser.element('#logout'); }
	get sideNavBar() { return browser.element('.side-nav '); }

	// Toolbar
	get spotlightSearch() { return browser.element('.toolbar-search__input'); }
	get spotlightSearchPopUp() { return browser.element('.toolbar .message-popup'); }
	get newChannelBtn() { return browser.element('.toolbar-search__create-channel'); }
	get newChannelIcon() { return browser.element('.toolbar-search__create-channel.icon-plus'); }

	// Rooms List
	get general() { return browser.element('.rooms-list .room-type:not(.unread-rooms-mode) + ul .open-room[title="general"]'); }
	get channelLeave() { return browser.element('.leave-room'); }
	get channelHoverIcon() { return browser.element('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off'); }
	get moreChannels() { return browser.element('.rooms-list .more-channels'); }

	// Account
	get preferences() { return browser.element('[href="/account/preferences"]'); }
	get profile() { return browser.element('[href="/account/profile"]'); }
	get avatar() { return browser.element('[href="/changeavatar"]'); }
	get preferencesClose() { return browser.element('.side-nav .arrow.close'); }

	get burgerBtn() { return browser.element('.burger'); }

	// Opens a channel via rooms list
	openChannel(channelName) {
		browser.waitForVisible(`.rooms-list ul:not(:first-of-type) a[title="${ channelName }"]`, 5000);
		browser.click(`.rooms-list ul:not(:first-of-type) a[title="${ channelName }"]`);
		browser.waitForVisible('.input-message', 5000);
		browser.waitUntil(function() {
			browser.waitForVisible('.fixed-title .room-title', 8000);
			return browser.getText('.fixed-title .room-title') === channelName;
		}, 10000);
	}

	// Opens a channel via spotlight search
	searchChannel(channelName) {
		browser.waitForVisible('.fixed-title .room-title', 15000);
		const currentRoom = browser.element('.fixed-title .room-title').getText();
		if (currentRoom !== channelName) {
			this.spotlightSearch.waitForVisible(5000);
			this.spotlightSearch.click();
			this.spotlightSearch.setValue(channelName);
			browser.waitForVisible(`[name='${ channelName }']`, 5000);
			browser.click(`[name='${ channelName }']`);
			browser.waitUntil(function() {
				browser.waitForVisible('.fixed-title .room-title', 8000);
				return browser.getText('.fixed-title .room-title') === channelName;
			}, 10000);

		}
	}

	// Gets a channel from the spotlight search
	getChannelFromSpotlight(channelName) {
		browser.waitForVisible('.fixed-title .room-title', 15000);
		const currentRoom = browser.element('.fixed-title .room-title').getText();
		if (currentRoom !== channelName) {
			this.spotlightSearch.waitForVisible(5000);
			this.spotlightSearch.click();
			this.spotlightSearch.setValue(channelName);
			browser.waitForVisible(`[name='${ channelName }']`, 5000);
			return browser.element(`[name='${ channelName }']`);
		}
	}

	// Gets a channel from the rooms list
	getChannelFromList(channelName, reverse) {
		if (reverse == null) {
			browser.waitForVisible(`.rooms-list .room-type:not(.unread-rooms-mode) + ul .open-room[title="${ channelName }"]`, 5000);
		}
		return browser.element(`.rooms-list .room-type:not(.unread-rooms-mode) + ul .open-room[title="${ channelName }"]`);
	}

	createChannel(channelName, isPrivate, isReadOnly) {
		this.newChannelBtn.waitForVisible(10000);
		this.newChannelBtn.click();
		this.channelName.waitForVisible(10000);

		//workaround for incomplete setvalue bug
		this.channelName.setValue(channelName);
		this.channelName.setValue(channelName);
		browser.pause(1000);

		this.channelType.waitForVisible(10000);
		if (isPrivate) {
			this.channelType.click();
		}
		if (isReadOnly) {
			this.channelReadOnly.click();
		}
		browser.pause(500);
		this.saveChannelBtn.click();
		browser.pause(500);
		browser.waitForExist(`[title="${ channelName }"]`, 10000);
		this.channelType.waitForVisible(5000, true);
	}
}

module.exports = new SideNav();
