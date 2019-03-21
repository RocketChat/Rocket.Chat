import Page from './Page';

import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';

class Discussioning extends Page {
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
	get startDiscussionContextItem() { return browser.element('[data-id="start-discussion"][data-type="message-action"]'); }

	// Modal
	get createDiscussionModal() {
		return browser.element('#create-discussion');
	}

	get discussionName() {
		return browser.element('#create-discussion #discussion_name');
	}

	get discussionMessage() {
		return browser.element('#create-discussion #discussion_message');
	}

	get parentChannelName() {
		return browser.element('#create-discussion #parentChannel');
	}

	get saveDiscussionButton() {
		return browser.element('.js-save-discussion');
	}

	// Sequences

	createDiscussion(parentChannelName, name, message) {
		sideNav.newChannelBtnToolbar.waitForVisible(1000);
		sideNav.newChannelBtnToolbar.click();
		sideNav.newDiscussionBtn.waitForVisible(1000);
		sideNav.newDiscussionBtn.click();
		this.createDiscussionModal.waitForVisible(1000);
		this.discussionName.setValue(name);
		this.discussionMessage.setValue(message);
		this.parentChannelName.waitForVisible(1000);
		this.parentChannelName.setValue(parentChannelName);

		const list = browser.element('.rc-popup-list__list');
		list.waitForVisible(2000);

		list.element('.rc-popup-list__item').waitForVisible(10000);
		list.element('.rc-popup-list__item').click();

		browser.waitUntil(function() {
			return browser.isEnabled('.js-save-discussion');
		}, 5000);

		this.saveDiscussionButton.click();
	}
}

const discussioning = new Discussioning();

export { discussioning };
