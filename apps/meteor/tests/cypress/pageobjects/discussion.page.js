import Page from './Page';
import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';

class Discussion extends Page {
	// Sidebar - this should actually be part of the sidebar-file - leaving it here for mergability
	get newDiscussionButton() {
		return browser.element('.menu-nav .js-create-discussion');
	}

	// Global - this should actually be part of the global-file - leaving it here for mergability
	deleteRoom(roomName) {
		if (roomName) {
			sideNav.openChannel(roomName);
		}
		flexTab.operateFlexTab('info', true);
		flexTab.deleteBtn.click();
		global.modal.waitForVisible(5000);
		global.confirmPopup();
	}

	// Action Menu
	get startDiscussionContextItem() {
		return browser.element('[data-qa-id="start-discussion"][data-qa-type="message-action"]');
	}

	// Modal
	get createDiscussionModal() {
		return browser.element('#create-discussion');
	}

	get discussionName() {
		return browser.element('.rcx-field:contains("Discussion name") input');
	}

	get discussionMessage() {
		return browser.element('.rcx-field:contains("Your message") textarea');
	}

	get parentChannelName() {
		return browser.element('.rcx-field:contains("Parent channel or group") input');
	}

	get saveDiscussionButton() {
		return browser.element('button:contains("Create")');
	}

	// Sequences

	createDiscussion(parentChannelName, name, message) {
		sideNav.newChannelBtnToolbar.click();
		sideNav.newDiscussionBtn.click();
		this.discussionName.type(name);
		this.discussionMessage.type(message);

		this.parentChannelName.type(parentChannelName);

		browser.element('.rcx-options .rcx-option:first-child').click();

		this.saveDiscussionButton.should('be.enabled');

		this.saveDiscussionButton.click();
	}
}

const discussion = new Discussion();

export { discussion };
