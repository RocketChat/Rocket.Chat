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
		sideNav.newChannelBtnToolbar.click();
		sideNav.newDiscussionBtn.click();
		this.discussionName.type(name);
		this.discussionMessage.type(message);

		this.parentChannelName.type(parentChannelName);

		browser.element('.rc-popup-list__list .rc-popup-list__item').click();

		cy.get('.js-save-discussion').should('be.enabled');

		this.saveDiscussionButton.click();
	}
}

const discussion = new Discussion();

export { discussion };
