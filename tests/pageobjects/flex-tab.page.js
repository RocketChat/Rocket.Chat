import Page from './Page';

class FlexTab extends Page {





	get membersTab() { return browser.element('[title~=Members]'); }
	get membersTabContent() { return browser.element('.animated'); }
	get userSearchBar() { return browser.element('#user-add-search'); }
	get removeUserBtn() { return browser.element('.remove-user'); }
	get startVideoCall() { return browser.element('.start-video-call'); }
	get startAudioCall() { return browser.element('.start-audio-call'); }
	get showAll() { return browser.element('.see-all'); }


	get channelTab() { return browser.element('[title="Room Info"]'); }
	get channelSettings() { return browser.element('.channel-settings'); }

	get searchTab() { return browser.element('[title="Search"]'); }
	get searchTabContent() { return browser.element('.search-messages-list'); }
	get messageSearchBar() { return browser.element('#message-search'); }
	get searchResult() { return browser.element('.new-day'); }

	get notificationsTab() { return browser.element('[title="Notifications"]'); }
	get notificationsSettings() { return browser.element('.push-notifications'); }

	get filesTab() { return browser.element('[title="Files List"]'); }
	get fileItem() { return browser.element('.uploaded-files-list ul:first-child'); }
	get filesTabContent() { return browser.element('.uploaded-files-list'); }
	get fileDelete() { return browser.element('.uploaded-files-list ul:first-child .file-delete'); }
	get fileDownload() { return browser.element('.uploaded-files-list ul:first-child .file-download'); }
	get fileName() { return browser.element('.uploaded-files-list ul:first-child .room-file-item'); }

	get mentionsTab() { return browser.element('[title="Mentions"]'); }
	get mentionsTabContent() { return browser.element('.mentioned-messages-list'); }



	get starredTab() { return browser.element('[title="Starred Messages"]'); }
	get starredTabContent() { return browser.element('.starred-messages-list'); }


	get pinnedTab() { return browser.element('[title="Pinned Messages"]'); }
	get pinnedTabContent() { return browser.element('.pinned-messages-list'); }



	get archiveBtn() { return browser.element('.clearfix:last-child .icon-pencil'); }
	get archiveRadio() { return browser.element('.editing'); }
	get archiveSave() { return browser.element('.save'); }

	get confirmBtn() { return browser.element('.confirm'); }

	closeTabs() {
		this.channelTab.click();
		browser.pause(500);
		this.channelTab.click();
	}

	confirmPopup() {
		this.confirmBtn.click();
	}

	archiveChannel() {
		browser.pause(3000);
		this.channelTab.click();
		this.archiveBtn.waitForVisible();
		this.archiveBtn.click();
		this.archiveRadio.waitForVisible();
		this.archiveRadio.click();
		this.archiveSave.click();
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
module.exports = new FlexTab();