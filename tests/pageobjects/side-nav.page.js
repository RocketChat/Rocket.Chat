import Page from './Page';

class SideNav extends Page {


	get directMessageTarget() { return browser.element('#who'); }
	get saveDirectMessageBtn() { return browser.element('.save-direct-message'); }



	get channelType() { return browser.element('#channel-type'); }
	get channelReadOnly() { return browser.element('#channel-ro'); }
	get channelName() { return browser.element('#channel-name'); }
	get saveChannelBtn() { return browser.element('.save-channel'); }

	get messageInput() { return browser.element('.input-message'); }

	get accountBoxUserName() { return browser.element('.account-box .data h4'); }
	get accountBoxUserAvatar() { return browser.element('.account-box .avatar-image'); }

	get newChannelBtn() { return browser.element('.rooms-list .add-room:nth-of-type(1)'); }
	get newChannelIcon() { return browser.element('.rooms-list .add-room:nth-of-type(1) .icon-plus'); }
	get moreChannels() { return browser.element('.rooms-list .more-channels'); }

	get newDirectMessageBtn() { return browser.element('.rooms-list .add-room:nth-of-type(2)'); }
	get newDirectMessageIcon() { return browser.element('.rooms-list .add-room:nth-of-type(2) .icon-plus'); }
	get moreDirectMessages() { return browser.element('.rooms-list .more-direct-messages'); }

	get general() { return browser.element('[title="general"]'); }
	get channelHoverIcon() { return browser.element('[title="general"] .icon-eye-off'); }

	get userOptions() { return browser.element('.options'); }
	get statusOnline() { return browser.element('.online'); }
	get statusAway() { return browser.element('.away'); }
	get statusBusy() { return browser.element('.busy'); }
	get statusOffline() { return browser.element('.offline'); }
	get account() { return browser.element('#account'); }
	get logout() { return browser.element('#logout'); }


	openChannel(channelName) {
		browser.click('[title="'+channelName+'"]');
		this.messageInput.waitForExist();
	}

	createChannel(channelName, isPrivate, isReadOnly) {
		this.newChannelBtn.click();
		this.channelType.waitForVisible(10000);
		this.channelName.setValue(channelName);
		if (isPrivate) {
			this.channelType.click();
		}
		if (isReadOnly) {
			this.channelReadOnly.click();
		}
		this.saveChannelBtn.click();
		browser.waitForExist('[title="'+channelName+'"]');
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



	startDirectMessage(user) {
		this.newDirectMessageBtn.click();
		this.directMessageTarget.waitForVisible(1000);
		this.directMessageTarget.setValue(user);
		browser.waitForVisible('.-autocomplete-item', 1000);
		browser.click('.-autocomplete-item');
		this.saveDirectMessageBtn.click();
		browser.waitForExist('[title="'+user+'"]');
	}
}

module.exports = new SideNav();