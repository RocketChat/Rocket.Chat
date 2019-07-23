import Page from './Page';
import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';


const Keys = {
	TAB: '\uE004',
	ENTER: '\uE007',
	ESCAPE: 'u\ue00c',
};

class Assistify extends Page {
	get knowledgebaseIcon() {
		return browser.element('.tab-button-icon--lightbulb');
	}

	// in order to communicate with Smarti we need the roomId.
	// funny enough, it's available in its DOM. A bit dirty, but very efficient

	get roomId() {
		return browser.element('.messages-container.flex-tab-main-content').getAttribute('id').replace('chat-window-', '');
	}

	get lastMessageId() {
		return browser.element('.message:last-child').getAttribute('id');
	}

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

	get knowledgebasePickAnswer() {
		return browser.element('#widgetBody .widgetContent .postAction');
	}

	get knowledgebaseContent() {
		return browser.element('[data-link="class{merge: messagesCnt toggle=\'parent\'}"]');
	}

	get knowledgebaseFilter() {
		return browser.element('#innerTabFilter .title');
	}

	get knowledgebaseContainer() {
		return browser.element('#widgetContainer');
	}

	// new Topic

	get topicName() {
		return browser.element('.create-channel__content input[name="expertise"]');
	}

	get requestTitle() {
		return browser.element('.create-channel__content input[name="request_title"]');
	}

	get topicExperts() {
		return browser.element('.create-channel__content input[name="experts"]');
	}

	get saveTopicBtn() {
		return browser.element('.create-channel__content [data-button="create"]');
	}

	get newChannelBtn() {
		return browser.element('.sidebar__toolbar-button-icon--edit-rounded');
	}

	get firstRequestMessage() {
		return browser.element('[name="first_question"]');
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

	get wordCloudLink() {
		return browser.element('[id="more-topics"]');
	}

	get wordCloudButton() {
		return browser.element('.rc-input__icon-svg--book-alt');
	}

	get wordCloudCanvas() {
		return browser.element('[id="wc-canvas"]');
	}

	// Knowledgebase
	get editInfoBtn() {
		return browser.element('.rc-button.rc-button--icon.rc-button--outline.js-edit');
	}

	get infoRoomIcon() {
		return browser.element('.flex-tab-container.border-component-color.opened .tab-button.active');
	}

	get addKeyword() {
		return browser.element('#tags .add');
	}

	get keywordTextBox() {
		return browser.element('#newTagInput');
	}

	get numberOfRequests() {
		return browser.element('#rocket-chat > aside > div.rooms-list > h3:nth-child(9) > span.badge');
	}

	get resync() {
		return browser.element('[data-setting="Assistify_AI_Resync_Full"]');
	}

	get sidebarMenu() { return browser.element('.sidebar__toolbar-button-icon--menu'); }

	get admin() { return browser.element('[data-id="administration"][data-type="open"]'); }


	// admin ui
	get assistifyAdminUi() {
		return browser.element('[href="/admin/Assistify"]');
	}

	get knowledgebaseUiExpand() {
		return browser.element('.button.primary.expand');
	}

	get resyncFullButton() {
		return browser.element('[data-action=triggerFullResync]');
	}

	escape() {
		browser.keys(Keys.ESCAPE);
	}

	createTopic(topicName, expert) {
		this.escape();
		this.newChannelBtn.waitForVisible(3000);
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
		browser.keys(Keys.TAB);
		// browser.pause(500);

		browser.waitUntil(function() {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(500);
	}

	openWordCloud(key) {
		this.newChannelBtn.waitForVisible(10000);
		this.newChannelBtn.click();
		this.tabs.waitForVisible(5000);
		if (this.tabs) {
			this.createRequestTab.waitForVisible(5000);
			this.createRequestTab.click();
		}

		this.topicName.waitForVisible(5000);
		this.topicName.setValue(key);

		this.wordCloudButton.waitForVisible(5000);
		this.wordCloudButton.click();
	}

	createHelpRequest(topicName, message, requestTitle) {
		this.escape();
		this.newChannelBtn.waitForVisible(1000);
		this.newChannelBtn.click();
		this.tabs.waitForVisible(5000);
		if (this.tabs) {
			this.createRequestTab.waitForVisible(5000);
			this.createRequestTab.click();
		}

		this.topicName.waitForVisible(5000);
		this.topicName.setValue(topicName);

		if (requestTitle) {
			this.requestTitle.waitForVisible(5000);
			this.requestTitle.setValue(requestTitle);
		}

		browser.pause(100);
		browser.keys(Keys.TAB);
		browser.pause(300);

		// if (message) {
		// 	browser.pause(2000);
		// 	this.firstRequestMessage.waitForVisible(5000);
		// 	this.firstRequestMessage.setValue(message);
		// }

		browser.waitUntil(function() {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(1000);

		this.sendTopicMessage(message);
	}

	sendTopicMessage(message) {
		this.messageTextField.waitForVisible(5000);
		this.messageTextField.setValue(message);
		this.sendMessageBtn.waitForVisible(5000);
		this.sendMessageBtn.click();
	}

	closeRequest() {
		this.knowledgebaseIcon.click();
		this.completeRequest.waitForVisible(5000);
		this.completeRequest.click();
		global.confirmPopup();
	}

	deleteRoom(roomName) {
		if (roomName) {
			sideNav.openChannel(roomName);
		}
		flexTab.operateFlexTab('info', true);
		this.deleteBtn.click();
		global.modal.waitForVisible(5000);
		global.confirmPopup();
	}

	/*	closeTopic(topicName) {
			flexTab.channelTab.waitForVisible(5000);
			flexTab.channelTab.click();
			this.editInfoBtn.waitForVisible(5000);
			this.editInfoBtn.click();
			this.closeTopicBtn.waitForVisible(5000);
			this.closeTopicBtn.click();
			global.confirmPopup();
		}*/

	clickKnowledgebase() {
		this.knowledgebaseIcon.waitForVisible(5000);
		this.knowledgebaseIcon.click();
	}

	addNewKeyword(keyword) {
		this.addKeyword.waitForVisible(5000);
		this.addKeyword.click();
		this.keywordTextBox.setValue(keyword);
		browser.keys(Keys.ENTER);
		browser.pause(1000);
	}

	logoutRocketchat() {
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.logout.waitForVisible(5000);
		sideNav.logout.click();
	}

	openAdminView() {
		this.sidebarMenu.waitForVisible(5000);
		this.sidebarMenu.click();
		this.admin.waitForVisible(5000);
		this.admin.click();
	}
}


module.exports = new Assistify();
