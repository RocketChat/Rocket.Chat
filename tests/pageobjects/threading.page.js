import Page from './Page';
import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';
import { sendEscape } from './keyboard';

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
		return browser.element('.create-thread');
	}

	get selectChannelAction() {
		return browser.element('.create-thread .js-select-parent');
	}

	get firstQuestion() {
		return browser.element('.create-thread #first_question');
	}

	get parentChannelName() {
		return browser.element('.create-thread #parentChannel-search');
	}

	get saveThreadButton() {
		return browser.element('.create-channel .js-save-thread');
	}

	// Sequences

	createThread(parentChannelName, message) {
		this.newThreadButton.waitForVisible(1000);
		this.newThreadButton.click();
		this.createThreadModal.waitForVisible(1000);
		this.firstQuestion.setValue(message);
		this.selectChannelAction.click();
		this.parentChannelName.waitForVisible(1000);
		this.parentChannelName.setValue(parentChannelName);
		sendEscape();
		browser.pause(2000); // wait for the autocompete to vanish - for sure

		browser.waitUntil(function() {
			return browser.isEnabled('.create-channel .js-save-thread');
		}, 5000);

		this.saveThreadButton.click();
	}
}

const threading = new Threading();

export { threading };
