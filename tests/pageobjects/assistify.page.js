import Page from './Page';

import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';


const Keys = {
	'TAB': '\uE004',
	'ENTER': '\uE007'
};
class Assistify extends Page {

	get knowledgebaseTab() {
		return browser.element('.tab-button:not(.hidden) .tab-button-icon--lightbulb');
	}

	get completeRequest() {
		return browser.element('.button.close-helprequest.button-block');
	}

	get commentClose() {
		return browser.element('.sweet-alert input[type="text"]');
	}

	get commentCloseOK() {
		return browser.element('.sweet-alert .sa-confirm-button-container');
	}

	get sendMessageBtn() {
		return browser.element('.rc-message-box__icon.rc-message-box__send.js-send');
	}

	get messageTextField() {
		return browser.element('.rc-message-box__container textarea');
	}


	get knowledgebaseAnswer() {
		return browser.element('.external-search-content .smarti-widget .search-results');
	}

	get knowledgebasePostBtn() {
		return browser.element('.external-search-content .smarti-widget .search-results .result-actions');
	}

	// new Topic

	get topicName() {
		return browser.element('.create-channel__content input[name="expertise"]');
	}

	get topicExperts() {
		return browser.element('.create-channel__content input[name="experts"]');
	}

	get saveTopicBtn() {
		return browser.element('.create-channel__content [data-button="create"]');
	}

	get newChannelBtn() {
		return browser.element('.toolbar .toolbar__search-create-channel');
	}


	// Tabs
	get tabs() {
		return browser.element('nav.rc-tabs');
	}

	get createTopicTab() {
		return browser.element('nav.rc-tabs .rc-tabs__tab-link.AssistifyCreateExpertise');
	}

	get createRequestTab() {
		return browser.element('nav.rc-tabs .rc-tabs__tab-link.AssistifyCreateRequest');
	}

	// Knowledgebase
	get closeTopicBtn() {
		return browser.element('.flex-tab-container.border-component-color.opened .delete');
	}

	get infoRoomIcon() {
		return browser.element('.flex-tab-container.border-component-color.opened .tab-button.active');
	}

	createTopic(topicName, expert) {
		this.newChannelBtn.waitForVisible(10000);
		this.newChannelBtn.click();

		if (this.tabs) {
			this.createTopicTab.waitForVisible(5000);
			this.createTopicTab.click();
		}

		this.topicName.waitForVisible(10000);
		this.topicName.setValue(topicName);

		this.topicExperts.waitForVisible(10000);
		this.topicExperts.setValue(expert);
		browser.pause(500);
		browser.element('.rc-popup-list__item').click();
		browser.pause(500);

		browser.waitUntil(function () {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(500);
	}

	createHelpRequest(topicName, message) {
		this.newChannelBtn.waitForVisible(10000);
		this.newChannelBtn.click();
		this.tabs.waitForVisible(5000);
		if (this.tabs) {
			this.createRequestTab.waitForVisible(5000);
			this.createRequestTab.click();
		}

		this.topicName.waitForVisible(5000);
		this.topicName.setValue(topicName);
		browser.keys(Keys.ENTER);

		browser.waitUntil(function () {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(500);

		this.clickKnowledgebase();
		this.sendTopicMessage(message);

	}

	sendTopicMessage(message) {
		this.messageTextField.waitForVisible(5000);
		this.messageTextField.setValue(message);
		this.sendMessageBtn.waitForVisible(5000);
		this.sendMessageBtn.click();
	}

	// answerRequest(topicName, message) {
	// 	sideNav.openChannel(topicName);
	//
	// 	this.sendTopicMessage(message);
	// }

	closeRequest(topicName, comment) {
		// sideNav.openChannel(topicName);
		this.knowledgebaseTab.click();

		this.completeRequest.waitForVisible(5000);
		this.completeRequest.click();

		// this.commentClose.waitForVisible(5000);
		// this.commentClose.setValue(comment);
		//
		// this.commentCloseOK.waitForVisible(5000);
		// this.commentCloseOK.click();
		global.confirmPopup();
	}

	closeTopic(topicName) {
		sideNav.openChannel(topicName);
		flexTab.channelTab.waitForVisible(5000);
		flexTab.channelTab.click();
		this.closeTopicBtn.waitForVisible(5000);
		this.closeTopicBtn.click();
		global.confirmPopup();
	}

	clickKnowledgebase() {
		this.knowledgebaseTab.waitForVisible(5000);
		this.knowledgebaseTab.click();
	}

	logoutRocketchat() {
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.logout.waitForVisible(5000);
		sideNav.logout.click();
	}
}


module.exports = new Assistify();
