import Page from './Page';

class FlexTab extends Page {

	get activeUser() { return browser.element('.data h4'); }



	get membersTab() { return browser.element('[title~=Members]'); }
	get userSearchBar() { return browser.element('#user-add-search'); }
	get removeUserBtn() { return browser.element('.remove-user'); }

	get channelTab() { return browser.element('[title="Room Info"]'); }
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