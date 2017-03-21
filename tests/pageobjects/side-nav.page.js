import Page from './Page';

class SideNav extends Page {
	get channelType() { return browser.element('label[for="channel-type"]'); }
	get channelReadOnly() { return browser.element('label[for="channel-ro"]'); }
	get channelName() { return browser.element('input#channel-name'); }
	get saveChannelBtn() { return browser.element('.save-channel'); }

	get messageInput() { return browser.element('.input-message'); }
	get burgerBtn() { return browser.element('.burger'); }

	get accountBoxUserName() { return browser.element('.account-box .data h4'); }
	get accountBoxUserAvatar() { return browser.element('.account-box .avatar-image'); }

	get newChannelBtn() { return browser.element('.toolbar-search__create-channel'); }
	get newChannelIcon() { return browser.element('.toolbar-search__create-channel.icon-plus'); }
	get moreChannels() { return browser.element('.rooms-list .more-channels'); }

	get newDirectMessageBtn() { return browser.element('.rooms-list .add-room:nth-of-type(2)'); }

	get general() { return browser.element('.rooms-list > .wrapper > ul [title="general"]'); }
	get channelHoverIcon() { return browser.element('.rooms-list > .wrapper > ul [title="general"] .icon-eye-off'); }

	get userOptions() { return browser.element('.options'); }
	get statusOnline() { return browser.element('.online'); }
	get statusAway() { return browser.element('.away'); }
	get statusBusy() { return browser.element('.busy'); }
	get statusOffline() { return browser.element('.offline'); }
	get account() { return browser.element('#account'); }
	get admin() { return browser.element('#admin'); }
	get logout() { return browser.element('#logout'); }
	get sideNavBar() { return browser.element('.side-nav '); }

	get preferences() { return browser.element('[href="/account/preferences"]'); }
	get profile() { return browser.element('[href="/account/profile"]'); }
	get avatar() { return browser.element('[href="/changeavatar"]'); }
	get preferencesClose() { return browser.element('.side-nav .arrow.close'); }
	get spotlightSearch() { return browser.element('.toolbar-search__input'); }
	get spotlightSearchPopUp() { return browser.element('.toolbar .message-popup'); }
	get channelLeave() { return browser.element('.leave-room'); }

	openChannel(channelName) {
		browser.click('.rooms-list > .wrapper > ul [title="'+channelName+'"]');
		this.messageInput.waitForExist(5000);
		browser.waitUntil(function() {
			return browser.getText('.room-title') === channelName;
		}, 5000);
	}

	searchChannel(channelName) {
		this.spotlightSearch.waitForVisible(5000);
		this.spotlightSearch.click();
		this.spotlightSearch.setValue(channelName);
		browser.waitForVisible('.room-title='+channelName, 10000);
		browser.click('.room-title='+channelName);
		browser.waitUntil(function() {
			return browser.getText('.room-title') === channelName;
		}, 5000);
	}

	getChannelFromSpotlight(channelName) {
		this.spotlightSearch.waitForVisible(5000);
		this.spotlightSearch.click();
		this.spotlightSearch.setValue(channelName);
		browser.waitForVisible('.room-title='+channelName, 5000);
		return browser.element('.room-title='+channelName);
	}

	getChannelFromList(channelName) {
		return browser.element('.rooms-list > .wrapper > ul [title="'+channelName+'"]');
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
		browser.waitForExist('[title="'+channelName+'"]', 10000);
		this.channelType.waitForVisible(5000, true);
	}

	addPeopleToChannel(user) {
		this.membersTab.click();
		this.userSearchBar.waitForVisible();
		this.userSearchBar.setValue(user);
		browser.waitForVisible('.-autocomplete-item');
		browser.click('.-autocomplete-item');
	}

	removePeopleFromChannel(user) {
		this.membersTab.click();
		browser.waitForVisible('[title="'+user+'"]');
		browser.click('[title="'+user+'"]');
		this.removeUserBtn.click();
	}
}

module.exports = new SideNav();
