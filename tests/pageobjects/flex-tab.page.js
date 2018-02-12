import Page from './Page';
import Global from './global';

class FlexTab extends Page {
	get moreActions() { return browser.element('.rc-room-actions__button.js-more'); }
	// Channel Info Tab
	get channelTab() { return browser.element('.tab-button:not(.hidden) .tab-button-icon--info-circled'); }
	get channelSettings() { return browser.element('.channel-settings'); }
	get channelSettingName() { return browser.element('.channel-settings .rc-user-info__name'); }
	get archiveBtn() { return browser.element('.clearfix:last-child .icon-pencil'); }
	get archiveRadio() { return browser.element('.editing'); }
	get archiveSave() { return browser.element('.save'); }
	get editNameBtn() { return browser.element('[data-edit="name"]'); }
	get editTopicBtn() { return browser.element('[data-edit="topic"]'); }
	get editAnnouncementBtn() { return browser.element('[data-edit="announcement"]'); }
	get editDescriptionBtn() { return browser.element('[data-edit="description"]'); }
	get editNotificationBtn() { return browser.element('[data-edit="desktopNotifications"]'); }
	get editMobilePushBtn() { return browser.element('[data-edit="mobilePushNotifications"]'); }
	get editEmailNotificationBtn() { return browser.element('[data-edit="emailNotifications"]'); }
	get editUnreadAlertBtn() { return browser.element('[data-edit="unreadAlert"]'); }
	get editNameTextInput() { return browser.element('.channel-settings input[name="name"]'); }
	get editTopicTextInput() { return browser.element('.channel-settings input[name="topic"]'); }
	get editAnnouncementTextInput() { return browser.element('.channel-settings input[name="announcement"]'); }
	get editDescriptionTextInput() { return browser.element('.channel-settings input[name="description"]'); }
	get editNameSave() { return browser.element('.channel-settings .save'); }

	// Members Tab
	get membersTab() { return browser.element('.tab-button:not(.hidden) .tab-button-icon--team'); }
	get membersTabContent() { return browser.element('.animated'); }
	get userSearchBar() { return browser.element('#user-add-search'); }
	get removeUserBtn() { return browser.element('.remove-user'); }
	get setOwnerBtn() { return browser.element('.set-owner'); }
	get setModeratorBtn() { return browser.element('.set-moderator'); }
	get muteUserBtn() { return browser.element('.mute-user'); }
	get viewAllBtn() { return browser.element('.button.back'); }
	get startVideoCall() { return browser.element('.start-video-call'); }
	get startAudioCall() { return browser.element('.start-audio-call'); }
	get showAll() { return browser.element('.see-all'); }
	get membersUserInfo() { return browser.element('.flex-tab-container .info'); }
	get avatarImage() { return browser.element('.flex-tab-container .avatar-image'); }
	get memberUserName() { return browser.element('.info h3'); }
	get memberRealName() { return browser.element('.info p'); }


	// Search Tab
	get searchTab() { return browser.element('.tab-button:not(.hidden) .tab-button-icon--magnifier'); }
	get searchTabContent() { return browser.element('.search-messages-list'); }
	get messageSearchBar() { return browser.element('#message-search'); }
	get searchResult() { return browser.element('.new-day'); }

	// Notifications Tab
	get notificationsTab() { return browser.element('.rc-popover__item[data-id=push-notifications]'); }
	get notificationsSettings() { return browser.element('.push-notifications'); }

	// Files Tab
	get filesTab() { return browser.element('.rc-popover__item[data-id=uploaded-files-list]'); }
	get fileItem() { return browser.element('.uploaded-files-list ul:first-child'); }
	get filesTabContent() { return browser.element('.uploaded-files-list'); }
	get fileDelete() { return browser.element('.uploaded-files-list ul:first-child .file-delete'); }
	get fileDownload() { return browser.element('.uploaded-files-list ul:first-child .file-download'); }
	get fileName() { return browser.element('.uploaded-files-list ul:first-child .room-file-item'); }

	// Mentions Tab
	get mentionsTab() { return browser.element('.rc-popover__item[data-id=mentions]'); }
	get mentionsTabContent() { return browser.element('.mentioned-messages-list'); }

	// Starred Tab
	get starredTab() { return browser.element('.rc-popover__item[data-id=starred-messages]'); }
	get starredTabContent() { return browser.element('.starred-messages-list'); }

	// Pinned Tab
	get pinnedTab() { return browser.element('.rc-popover__item[data-id=pinned-messages]'); }
	get pinnedTabContent() { return browser.element('.pinned-messages-list'); }

	get firstSetting() { return browser.element('.clearfix li:nth-child(1) .current-setting'); }
	get secondSetting() { return browser.element('.clearfix li:nth-child(2) .current-setting'); }
	get thirdSetting() { return browser.element('.clearfix li:nth-child(3) .current-setting'); }
	get fourthSetting() { return browser.element('.clearfix li:nth-child(4) .current-setting'); }

	//admin view flextab items
	get usersSendInvitationTab() { return browser.element('.tab-button:not(.hidden) .tab-button-icon--send'); }
	get usersAddUserTab() { return browser.element('.tab-button:not(.hidden) .tab-button-icon--plus'); }
	get usersSendInvitationTextArea() { return browser.element('#inviteEmails'); }
	get usersButtonCancel() { return browser.element('.button.cancel'); }
	get usersSendInvitationSend() { return browser.element('.button.send'); }
	get usersButtonSave() { return browser.element('.button.save'); }
	get usersAddUserName() { return browser.element('#name'); }
	get usersAddUserUsername() { return browser.element('#username'); }
	get usersAddUserEmail() { return browser.element('#email'); }
	get usersAddUserRoleList() { return browser.element('#roleSelect'); }
	get usersAddUserPassword() { return browser.element('#password'); }
	get usersAddUserRoleButton() { return browser.element('#addRole'); }
	get usersAddUserVerifiedCheckbox() { return browser.element('#verified'); }
	get usersAddUserChangePasswordCheckbox() { return browser.element('#changePassword'); }
	get usersAddUserDefaultChannelCheckbox() { return browser.element('#joinDefaultChannels'); }
	get usersAddUserWelcomeEmailCheckbox() { return browser.element('#sendWelcomeEmail'); }
	get usersAddUserRandomPassword() { return browser.element('#randomPassword'); }
	get emojiNewAliases() { return browser.element('#aliases'); }
	get emojiNewImageInput() { return browser.element('#image'); }
	get usersView() { return browser.element('.rc-user-info-action'); }
	get usersActivate() { return browser.element('.rc-popover__item[data-id=activate]'); }
	get usersDeactivate() { return browser.element('.rc-popover__item[data-id=deactivate]'); }

	getUserEl(username) { return browser.element(`.flex-tab button[title="${username}"] > p`); }

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
		//desiredState true=open false=closed
		switch (desiredTab) {
			case 'info':
				if ((!this.channelSettings.isVisible() && desiredState) || (this.channelSettings.isVisible() && !desiredState)) {
					this.channelTab.waitForVisible(5000);
					this.channelTab.click();
					this.channelSettings.waitForVisible(5000, !desiredState);
				}
				break;

			case 'search':
				if ((!this.messageSearchBar.isVisible() && desiredState) || (this.messageSearchBar.isVisible() && !desiredState)) {
					this.searchTab.waitForVisible(5000);
					this.searchTab.click();
					this.messageSearchBar.waitForVisible(5000, !desiredState);
				}
				break;

			case 'members':
				if ((!this.avatarImage.isVisible() && desiredState) || (this.userSearchBar.isVisible() && !desiredState)) {
					this.membersTab.waitForVisible(5000);
					this.membersTab.click();
					this.avatarImage.waitForVisible(5000, !desiredState);
				}
				break;

			case 'notifications':
				if ((!this.notificationsSettings.isVisible() && desiredState) || (this.notificationsSettings.isVisible() && !desiredState)) {
					this.notificationsTab.waitForVisible(5000);
					this.notificationsTab.click();
					this.notificationsSettings.waitForVisible(5000, !desiredState);
				}
				break;
			case 'files':
				if ((!this.filesTabContent.isVisible() && desiredState) || (this.filesTabContent.isVisible() && !desiredState)) {
					this.filesTab.waitForVisible(5000);
					this.filesTab.click();
					this.filesTabContent.waitForVisible(5000, !desiredState);
				}
				break;

			case 'mentions':
				if ((!this.mentionsTabContent.isVisible() && desiredState) || (this.mentionsTabContent.isVisible() && !desiredState)) {
					this.mentionsTab.waitForVisible(5000);
					this.mentionsTab.click();
					this.mentionsTabContent.waitForVisible(5000, !desiredState);
				}
				break;

			case 'starred':
				if ((!this.starredTabContent.isVisible() && desiredState) || (this.starredTabContent.isVisible() && !desiredState)) {
					this.starredTab.waitForVisible(5000);
					this.starredTab.click();
					this.starredTabContent.waitForVisible(5000, !desiredState);
				}
				break;

			case 'pinned':
				if ((!this.pinnedTabContent.isVisible() && desiredState) || (this.pinnedTabContent.isVisible() && !desiredState)) {
					this.pinnedTab.waitForVisible(5000);
					this.pinnedTab.click();
					this.pinnedTabContent.waitForVisible(5000, !desiredState);
				}
				break;
		}
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

module.exports = new FlexTab();
