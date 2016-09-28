import Page from './Page';

class SideNav extends Page {

	get newDirectMessageBtn() { return browser.element('.add-room:nth-of-type(2)'); }
	get directMessageTarget() { return browser.element('#who'); }
	get directMessageBtn() { return browser.element('[title=rocket.cat]'); }
	get saveDirectMessageBtn() { return browser.element('.save-direct-message'); }

	get newChannelBtn() { return browser.element('.add-room:nth-of-type(1)'); }
	get channelType() { return browser.element('#channel-type'); }
	get channelReadOnly() { return browser.element('#channel-ro'); }
	get channelName() { return browser.element('#channel-name'); }
	get saveChannelBtn() { return browser.element('.save-channel'); }

	get messageInput() { return browser.element('.input-message'); }

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
		this.directMessageTarget.waitForVisible();
		this.directMessageTarget.setValue(user);
		browser.waitForVisible('.-autocomplete-item');
		browser.click('.-autocomplete-item');
		this.saveDirectMessageBtn.click();
		browser.waitForExist('[title="'+user+'"]');
	}
}

module.exports = new SideNav();