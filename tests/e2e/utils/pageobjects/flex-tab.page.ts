import { expect, Locator, Page } from '@playwright/test';

import Pages from './Pages';
// import Global from './global';

class FlexTab extends Pages {
	constructor(browser: any, baseURL: any, page: Page) {
		super(browser, baseURL);
		this.page = page;
	}

	public headerMoreActions(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-kebab');
	}

	public moreActions(): Locator {
		return this.page.locator('.rcx-button-group__item:not(.hidden) .rcx-icon--name-kebab');
	}

	public sendBtn(): Locator {
		return this.page.locator('.rcx-vertical-bar .rc-message-box__icon.js-send');
	}

	public messageInput(): Locator {
		return this.page.locator('.rcx-vertical-bar .js-input-message');
	}

	public threadTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-thread');
	}

	// Channel Info Tab
	public channelTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-info-circled');
	}

	public channelSettings(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-info-circled');
	}

	public channelSettingName(): Locator {
		return this.page.locator('.channel-settings .rc-user-info__name');
	}

	public archiveBtn(): Locator {
		return this.page.locator('.clearfix:last-child .icon-pencil');
	}

	public archiveRadio(): Locator {
		return this.page.locator('.editing');
	}

	public archiveSave(): Locator {
		return this.page.locator('.save');
	}

	public editNameBtn(): Locator {
		return this.page.locator('[data-edit="name"]');
	}

	public editTopicBtn(): Locator {
		return this.page.locator('[data-edit="topic"]');
	}

	public editAnnouncementBtn(): Locator {
		return this.page.locator('[data-edit="announcement"]');
	}

	public editDescriptionBtn(): Locator {
		return this.page.locator('[data-edit="description"]');
	}

	public editNotificationBtn(): Locator {
		return this.page.locator('[data-edit="desktopNotifications"]');
	}

	public editMobilePushBtn(): Locator {
		return this.page.locator('[data-edit="mobilePushNotifications"]');
	}

	public editEmailNotificationBtn(): Locator {
		return this.page.locator('[data-edit="emailNotifications"]');
	}

	public editUnreadAlertBtn(): Locator {
		return this.page.locator('[data-edit="unreadAlert"]');
	}

	public editNameTextInput(): Locator {
		return this.page.locator('.channel-settings input[name="name"]');
	}

	public editTopicTextInput(): Locator {
		return this.page.locator('.channel-settings input[name="topic"]');
	}

	public editAnnouncementTextInput(): Locator {
		return this.page.locator('.channel-settings input[name="announcement"]');
	}

	public editDescriptionTextInput(): Locator {
		return this.page.locator('.channel-settings input[name="description"]');
	}

	public editNameSave(): Locator {
		return this.page.locator('.channel-settings .save');
	}

	public deleteBtn(): Locator {
		return this.page.locator('.channel-settings .js-delete');
	}

	// Members Tab
	public membersTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-members');
	}

	public membersTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-members');
	}

	public userSearchBar(): Locator {
		return this.page.locator('#user-add-search');
	}

	public removeUserBtn(): Locator {
		return this.page.locator('.remove-user');
	}

	public setOwnerBtn(): Locator {
		return this.page.locator('.set-owner');
	}

	public setModeratorBtn(): Locator {
		return this.page.locator('.set-moderator');
	}

	public muteUserBtn(): Locator {
		return this.page.locator('.mute-user');
	}

	public viewAllBtn(): Locator {
		return this.page.locator('.button.back');
	}

	public startVideoCall(): Locator {
		return this.page.locator('.start-video-call');
	}

	public startAudioCall(): Locator {
		return this.page.locator('.start-audio-call');
	}

	public showAll(): Locator {
		return this.page.locator('.see-all');
	}

	public membersUserInfo(): Locator {
		return this.page.locator('.flex-tab-container .info');
	}

	public avatarImage(): Locator {
		return this.page.locator('aside.rcx-vertical-bar .rcx-avatar');
	}

	public memberUserName(): Locator {
		return this.page.locator('.info h3');
	}

	public memberRealName(): Locator {
		return this.page.locator('.info p');
	}

	// Search Tab
	public searchTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-magnifier');
	}

	public searchTabContent(): Locator {
		return this.page.locator('.rocket-search-result');
	}

	public messageSearchBar(): Locator {
		return this.page.locator('#message-search');
	}

	public searchResult(): Locator {
		return this.page.locator('.new-day');
	}

	// Notifications Tab
	public notificationsTab(): Locator {
		return this.page.locator('.rcx-option__content:contains("Notifications Preferences")');
	}

	public notificationsSettings(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-bell');
	}

	// Files Tab
	public filesTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-clip');
	}

	public fileItem(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child');
	}

	public filesTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-attachment');
	}

	public fileDelete(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .file-delete');
	}

	public fileDownload(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .file-download');
	}

	public fileName(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .room-file-item');
	}

	// Mentions Tab
	public mentionsTab(): Locator {
		return this.page.locator('.rcx-option__content:contains("Mentions")');
	}

	public mentionsTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-at');
	}

	// Starred Tab
	public starredTab(): Locator {
		return this.page.locator('.rcx-option__content:contains("Starred Messages")');
	}

	public starredTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-star');
	}

	// Pinned Tab
	public pinnedTab(): Locator {
		return this.page.locator('.rcx-option__content:contains("Pinned Messages")');
	}

	public pinnedTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-pin');
	}

	public firstSetting(): Locator {
		return this.page.locator('.clearfix li:nth-child(1) .current-setting');
	}

	public secondSetting(): Locator {
		return this.page.locator('.clearfix li:nth-child(2) .current-setting');
	}

	public thirdSetting(): Locator {
		return this.page.locator('.clearfix li:nth-child(3) .current-setting');
	}

	public fourthSetting(): Locator {
		return this.page.locator('.clearfix li:nth-child(4) .current-setting');
	}

	// admin view flextab items
	public usersSendInvitationTab(): Locator {
		return this.page.locator('.tab-button:not(.hidden) .tab-button-icon--send');
	}

	public usersAddUserTab(): Locator {
		return this.page.locator('.tab-button:not(.hidden) .tab-button-icon--plus');
	}

	public usersSendInvitationTextArea(): Locator {
		return this.page.locator('#inviteEmails');
	}

	public usersButtonCancel(): Locator {
		return this.page.locator('.button.cancel');
	}

	public usersSendInvitationSend(): Locator {
		return this.page.locator('.button.send');
	}

	public usersButtonSave(): Locator {
		return this.page.locator('.button.save');
	}

	public usersAddUserName(): Locator {
		return this.page.locator('#name');
	}

	public usersAddUserUsername(): Locator {
		return this.page.locator('#username');
	}

	public usersAddUserEmail(): Locator {
		return this.page.locator('#email');
	}

	public usersAddUserRoleList(): Locator {
		return this.page.locator('#roleSelect');
	}

	public usersAddUserPassword(): Locator {
		return this.page.locator('#password');
	}

	public usersAddUserRoleButton(): Locator {
		return this.page.locator('#addRole');
	}

	public usersAddUserVerifiedCheckbox(): Locator {
		return this.page.locator('#verified');
	}

	public usersAddUserChangePasswordCheckbox(): Locator {
		return this.page.locator('#changePassword');
	}

	public usersAddUserDefaultChannelCheckbox(): Locator {
		return this.page.locator('#joinDefaultChannels');
	}

	public usersAddUserWelcomeEmailCheckbox(): Locator {
		return this.page.locator('#sendWelcomeEmail');
	}

	public usersAddUserRandomPassword(): Locator {
		return this.page.locator('#randomPassword');
	}

	public emojiNewAliases(): Locator {
		return this.page.locator('#aliases');
	}

	public emojiNewImageInput(): Locator {
		return this.page.locator('#image');
	}

	public usersView(): Locator {
		return this.page.locator('.rcx-vertical-bar:contains("User Info")');
	}

	public usersActivate(): Locator {
		return this.page.locator('.rcx-option__content:contains("Activate")');
	}

	public usersDeactivate(): Locator {
		return this.page.locator('.rcx-option__content:contains("Deactivate")');
	}

	public getUserEl(username: any): Locator {
		return this.page.locator(`.flex-tab button[title="${username}"] > p`);
	}

	public async archiveChannel(): Promise<void> {
		await this.archiveBtn().waitFor();
		await this.archiveBtn().click();
		await this.archiveRadio().waitFor();
		await this.archiveRadio().click();
		await this.archiveSave().click();
	}

	public async addPeopleToChannel(user: any): Promise<void> {
		await this.userSearchBar().waitFor();
		await this.userSearchBar().type(user);
		this.page.waitForSelector('.-autocomplete-item');
		this.page.click('.-autocomplete-item');
	}

	public async operateFlexTab(desiredTab: string, desiredState: boolean): Promise<void> {
		// desiredState true=open false=closed
		const functionNames: { [K: string]: Function } = {
			channelSettings: this.channelSettings,
			messageSearchBar: this.messageSearchBar,
			avatarImage: this.avatarImage,
			notificationsSettings: this.notificationsSettings,
			filesTabContent: this.filesTabContent,
			mentionsTabContent: this.mentionsTabContent,
			starredTabContent: this.starredTabContent,
			pinnedTabContent: this.pinnedTabContent,
		};

		const callFunction = (name: string): Locator => {
			return functionNames[name]();
		};

		const operate = async (tab: string, panel: string, more: boolean): Promise<void> => {
			// this[panel].should(!desiredState ? 'be.visible' : 'not.exist');
			if (desiredState) {
				await expect(callFunction(panel)).toBeVisible();
			} else {
				await expect(callFunction(panel)).toBeVisible();
			}

			if (more) {
				this.headerMoreActions().click();
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
}

export default FlexTab;
