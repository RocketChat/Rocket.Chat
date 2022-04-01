import Page from './Page';
import Global from './global';

class FlexTab extends Page {
	get headerMoreActions() {
		return browser.element('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-kebab');
	}

	get moreActions() {
		return browser.element('.rcx-button-group__item:not(.hidden) .rcx-icon--name-kebab');
	}

	get sendBtn() {
		return browser.element('.rcx-vertical-bar .rc-message-box__icon.js-send');
	}

	get messageInput() {
		return browser.element('.rcx-vertical-bar .js-input-message');
	}

	get threadTab() {
		return browser.element('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-thread');
	}

	// Channel Info Tab
	get channelTab() {
		return browser.element('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-info-circled');
	}

	get channelSettings() {
		return browser.element('aside > h3 > div > i.rcx-box--full.rcx-icon--name-info-circled');
	}

	get channelSettingName() {
		return browser.element('.channel-settings .rc-user-info__name');
	}

	get archiveBtn() {
		return browser.element('.clearfix:last-child .icon-pencil');
	}

	get archiveRadio() {
		return browser.element('.editing');
	}

	get archiveSave() {
		return browser.element('.save');
	}

	get editNameBtn() {
		return browser.element('[data-edit="name"]');
	}

	get editTopicBtn() {
		return browser.element('[data-edit="topic"]');
	}

	get editAnnouncementBtn() {
		return browser.element('[data-edit="announcement"]');
	}

	get editDescriptionBtn() {
		return browser.element('[data-edit="description"]');
	}

	get editNotificationBtn() {
		return browser.element('[data-edit="desktopNotifications"]');
	}

	get editMobilePushBtn() {
		return browser.element('[data-edit="mobilePushNotifications"]');
	}

	get editEmailNotificationBtn() {
		return browser.element('[data-edit="emailNotifications"]');
	}

	get editUnreadAlertBtn() {
		return browser.element('[data-edit="unreadAlert"]');
	}

	get editNameTextInput() {
		return browser.element('.channel-settings input[name="name"]');
	}

	get editTopicTextInput() {
		return browser.element('.channel-settings input[name="topic"]');
	}

	get editAnnouncementTextInput() {
		return browser.element('.channel-settings input[name="announcement"]');
	}

	get editDescriptionTextInput() {
		return browser.element('.channel-settings input[name="description"]');
	}

	get editNameSave() {
		return browser.element('.channel-settings .save');
	}

	get deleteBtn() {
		return browser.element('.channel-settings .js-delete');
	}

	// Members Tab
	get membersTab() {
		return browser.element('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-members');
	}

	get membersTabContent() {
		return browser.element('aside > h3 > div > i.rcx-box--full.rcx-icon--name-members');
	}

	get userSearchBar() {
		return browser.element('#user-add-search');
	}

	get removeUserBtn() {
		return browser.element('.remove-user');
	}

	get setOwnerBtn() {
		return browser.element('.set-owner');
	}

	get setModeratorBtn() {
		return browser.element('.set-moderator');
	}

	get muteUserBtn() {
		return browser.element('.mute-user');
	}

	get viewAllBtn() {
		return browser.element('.button.back');
	}

	get startVideoCall() {
		return browser.element('.start-video-call');
	}

	get startAudioCall() {
		return browser.element('.start-audio-call');
	}

	get showAll() {
		return browser.element('.see-all');
	}

	get membersUserInfo() {
		return browser.element('.flex-tab-container .info');
	}

	get avatarImage() {
		return browser.element('aside.rcx-vertical-bar .rcx-avatar');
	}

	get memberUserName() {
		return browser.element('.info h3');
	}

	get memberRealName() {
		return browser.element('.info p');
	}

	// Search Tab
	get searchTab() {
		return browser.element('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-magnifier');
	}

	get searchTabContent() {
		return browser.element('.rocket-search-result');
	}

	get messageSearchBar() {
		return browser.element('#message-search');
	}

	get searchResult() {
		return browser.element('.new-day');
	}

	// Notifications Tab
	get notificationsTab() {
		return browser.element('.rcx-option__content:contains("Notifications Preferences")');
	}

	get notificationsSettings() {
		return browser.element('aside > h3 > div > i.rcx-box--full.rcx-icon--name-bell');
	}

	// Files Tab
	get filesTab() {
		return browser.element('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-clip');
	}

	get fileItem() {
		return browser.element('.uploaded-files-list ul:first-child');
	}

	get filesTabContent() {
		return browser.element('aside > h3 > div > i.rcx-icon--name-attachment');
	}

	get fileDelete() {
		return browser.element('.uploaded-files-list ul:first-child .file-delete');
	}

	get fileDownload() {
		return browser.element('.uploaded-files-list ul:first-child .file-download');
	}

	get fileName() {
		return browser.element('.uploaded-files-list ul:first-child .room-file-item');
	}

	// Mentions Tab
	get mentionsTab() {
		return browser.element('.rcx-option__content:contains("Mentions")');
	}

	get mentionsTabContent() {
		return browser.element('aside > h3 > div > i.rcx-icon--name-at');
	}

	// Starred Tab
	get starredTab() {
		return browser.element('.rcx-option__content:contains("Starred Messages")');
	}

	get starredTabContent() {
		return browser.element('aside > h3 > div > i.rcx-icon--name-star');
	}

	// Pinned Tab
	get pinnedTab() {
		return browser.element('.rcx-option__content:contains("Pinned Messages")');
	}

	get pinnedTabContent() {
		return browser.element('aside > h3 > div > i.rcx-icon--name-pin');
	}

	get firstSetting() {
		return browser.element('.clearfix li:nth-child(1) .current-setting');
	}

	get secondSetting() {
		return browser.element('.clearfix li:nth-child(2) .current-setting');
	}

	get thirdSetting() {
		return browser.element('.clearfix li:nth-child(3) .current-setting');
	}

	get fourthSetting() {
		return browser.element('.clearfix li:nth-child(4) .current-setting');
	}

	// admin view flextab items
	get usersSendInvitationTab() {
		return browser.element('.tab-button:not(.hidden) .tab-button-icon--send');
	}

	get usersAddUserTab() {
		return browser.element('.tab-button:not(.hidden) .tab-button-icon--plus');
	}

	get usersSendInvitationTextArea() {
		return browser.element('#inviteEmails');
	}

	get usersButtonCancel() {
		return browser.element('.button.cancel');
	}

	get usersSendInvitationSend() {
		return browser.element('.button.send');
	}

	get usersButtonSave() {
		return browser.element('.button.save');
	}

	get usersAddUserName() {
		return browser.element('#name');
	}

	get usersAddUserUsername() {
		return browser.element('#username');
	}

	get usersAddUserEmail() {
		return browser.element('#email');
	}

	get usersAddUserRoleList() {
		return browser.element('#roleSelect');
	}

	get usersAddUserPassword() {
		return browser.element('#password');
	}

	get usersAddUserRoleButton() {
		return browser.element('#addRole');
	}

	get usersAddUserVerifiedCheckbox() {
		return browser.element('#verified');
	}

	get usersAddUserChangePasswordCheckbox() {
		return browser.element('#changePassword');
	}

	get usersAddUserDefaultChannelCheckbox() {
		return browser.element('#joinDefaultChannels');
	}

	get usersAddUserWelcomeEmailCheckbox() {
		return browser.element('#sendWelcomeEmail');
	}

	get usersAddUserRandomPassword() {
		return browser.element('#randomPassword');
	}

	get emojiNewAliases() {
		return browser.element('#aliases');
	}

	get emojiNewImageInput() {
		return browser.element('#image');
	}

	get usersView() {
		return browser.element('.rcx-vertical-bar:contains("User Info")');
	}

	get usersActivate() {
		return browser.element('.rcx-option__content:contains("Activate")');
	}

	get usersDeactivate() {
		return browser.element('.rcx-option__content:contains("Deactivate")');
	}

	getUserEl(username) {
		return browser.element(`.flex-tab button[title="${username}"] > p`);
	}

	archiveChannel() {
		this.archiveBtn.waitForVisible();
		this.archiveBtn.click();
		this.archiveRadio.waitForVisible();
		this.archiveRadio.click();
		this.archiveSave.click();
	}

	addPeopleToChannel(user) {
		this.userSearchBar.waitForVisible();
		this.userSearchBar.setValue(user);
		browser.waitForVisible('.-autocomplete-item', 5000);
		browser.click('.-autocomplete-item');
	}

	removePeopleFromChannel(user) {
		this.enterUserView(user);
		this.removeUserBtn.waitForVisible(5000);
		this.removeUserBtn.click();
	}

	addRole(role) {
		this.usersAddUserRoleList.waitForVisible(5000);
		this.usersAddUserRoleList.click();
		browser.waitForVisible(`option[value=${role}]`, 5000);
		browser.click(`option[value=${role}]`);
		this.usersAddUserRoleButton.waitForVisible(5000);
		this.usersAddUserRoleButton.click();
		browser.waitForVisible(`.remove-role=${role}`);
	}

	operateFlexTab(desiredTab, desiredState) {
		// desiredState true=open false=closed

		const operate = (tab, panel, more) => {
			this[panel].should(!desiredState ? 'be.visible' : 'not.exist');

			if (more) {
				this.headerMoreActions.click();
			}

			this[tab].click();

			// The button "more" keeps the focus when popover is closed from a click
			// on an item, need to click again to change the status to unselected and
			// allow the next click to open the popover again
			if (more) {
				this.headerMoreActions.click();
			}

			this[panel].should(desiredState ? 'be.visible' : 'not.exist');
		};

		const tabs = {
			info() {
				operate('channelTab', 'channelSettings');
			},

			search() {
				operate('searchTab', 'messageSearchBar');
			},

			members() {
				operate('membersTab', 'avatarImage');
			},

			notifications() {
				operate('notificationsTab', 'notificationsSettings', true);
			},

			files() {
				operate('filesTab', 'filesTabContent');
			},

			mentions() {
				operate('mentionsTab', 'mentionsTabContent', true);
			},

			starred() {
				operate('starredTab', 'starredTabContent', true);
			},

			pinned() {
				operate('pinnedTab', 'pinnedTabContent', true);
			},
		};

		tabs[desiredTab].call(this);
	}

	setUserOwner(user) {
		this.enterUserView(user);
		this.setOwnerBtn.waitForVisible(5000);
		this.setOwnerBtn.click();
		this.viewAllBtn.click();
		browser.pause(100);
	}

	setUserModerator(user) {
		this.enterUserView(user);
		this.setModeratorBtn.waitForVisible();
		this.setModeratorBtn.click();
		this.viewAllBtn.click();
		browser.pause(100);
	}

	muteUser(user) {
		this.enterUserView(user);
		this.muteUserBtn.waitForVisible(5000);
		this.muteUserBtn.click();
		Global.confirmPopup();
		this.viewAllBtn.click();
		browser.pause(100);
	}

	enterUserView(user) {
		if (!this.membersUserInfo.isVisible()) {
			const userEl = this.getUserEl(user);
			userEl.waitForVisible();
			userEl.click();
		}
	}
}

export default new FlexTab();
