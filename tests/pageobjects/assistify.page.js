import Page from './Page';
import mainContent from './main-content.page';
import sideNav from './side-nav.page';

class Assistify extends Page {
	get knowledgebaseTab() {
		return browser.element('.tab-button:not(.hidden) .tab-button-icon--lightbulb');
	}

	get closeRequest() {
		return browser.element('.content external-search-content .button-block');
	}

	get commentClose() {
		return browser.element('.sweet-alert input[type="text"]');
	}

	get commentCloseOK() {
		return browser.element('.sweet-alert .sa-confirm-button-container');
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
		return browser.element('.flex-tab-container.border-component-color.opened li:nth-child(6)');
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
		browser.pause(500)
		browser.element('.rc-popup-list__item').click();
		browser.pause(500)

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

		if (this.tabs) {
			this.createRequestTab.waitForVisible(5000);
			this.createRequestTab.click();
		}

		this.topicName.waitForVisible(5000);
		this.topicName.setValue(topicName);

		browser.pause(1000)
		browser.element('.create-channel__content .rc-popup-list').click();
		browser.pause(500)

		browser.waitUntil(function () {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(500);


		mainContent.messageInput.waitForVisible(5000);
		mainContent.sendMessage(message);
	}

	answerRequest(topicName, message) {
		sideNav.openChannel(topicName);

		mainContent.messageInput.waitForVisible(5000);
		mainContent.sendMessage(message);
	}

	closeRequest(topicName, comment) {
		sideNav.openChannel(topicName);
		this.knowledgebaseTab.click();

		this.closeRequest.waitForVisible(5000);
		this.closeRequest.click();

		this.commentClose.waitForVisible(5000);
		this.commentClose.setValue(comment);

		this.commentCloseOK.waitForVisible(5000);
		this.commentCloseOK.click();
	}

	closeTopic(){
		this.infoRoomIcon.waitForVisible(5000);
		this.infoRoomIcon.click();
		this.closeTopicBtn.waitForVisible(5000);
		this.closeTopicBtn.click();
	}
}


module.exports = new Assistify();
