import Page from './Page';

import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';

class Threading extends Page {
	// Sidebar - this should actually be part of the sidebar-file - leaving it here for mergability
	get newThreadButton() {
		return browser.element('.menu-nav .js-create-thread');
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
	get startThreadContextItem() { return browser.element('[data-id="start-thread"][data-type="message-action"]'); }

	// Modal
	get createThreadModal() {
		return browser.element('#create-thread');
	}

	get threadName() {
		return browser.element('#create-thread #thread_name');
	}

	get threadMessage() {
		return browser.element('#create-thread #thread_message');
	}

	get parentChannelName() {
		return browser.element('#create-thread #parentChannel');
	}

	get saveThreadButton() {
		return browser.element('.js-save-thread');
	}

	// Sequences

	createThread(parentChannelName, name, message) {
		sideNav.newChannelBtnToolbar.waitForVisible(1000);
		sideNav.newChannelBtnToolbar.click();
		sideNav.newThreadBtn.waitForVisible(1000);
		sideNav.newThreadBtn.click();
		this.createThreadModal.waitForVisible(1000);
		this.threadName.setValue(name);
		this.threadMessage.setValue(message);
		this.parentChannelName.waitForVisible(1000);
		this.parentChannelName.setValue(parentChannelName);

		const list = browser.element('.rc-popup-list__list');
		list.waitForVisible(2000);

		list.element('.rc-popup-list__item').waitForVisible(10000);
		list.element('.rc-popup-list__item').click();

		browser.waitUntil(function() {
			return browser.isEnabled('.js-save-thread');
		}, 5000);

		this.saveThreadButton.click();
	}
}

const threading = new Threading();

export { threading };
