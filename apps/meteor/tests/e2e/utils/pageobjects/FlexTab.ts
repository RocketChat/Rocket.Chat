import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';
import Global from './Global';

class FlexTab extends BasePage {
	private global = new Global(this.getPage());

	public mainSideBar(): Locator {
		return this.getPage().locator('//main//aside');
	}

	public mainSideBarBack(): Locator {
		return this.getPage().locator('(//main//aside/h3//button)[1]');
	}

	public mainSideBarClose(): Locator {
		return this.getPage().locator('//main//aside/h3//i[contains(@class, "rcx-icon--name-cross")]/..');
	}

	public headerMoreActions(): Locator {
		return this.getPage().locator('//main/header//*[contains(@class, "rcx-icon--name-kebab")]/..');
	}

	public moreActions(): Locator {
		return this.getPage().locator('.rcx-button-group__item:not(.hidden) .rcx-icon--name-kebab');
	}

	public sendBtn(): Locator {
		return this.getPage().locator('.rcx-vertical-bar .rc-message-box__icon.js-send');
	}

	public messageInput(): Locator {
		return this.getPage().locator('.rcx-vertical-bar .js-input-message');
	}

	public threadTab(): Locator {
		return this.getPage().locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-thread');
	}

	// Channel Info Tab
	public channelTab(): Locator {
		return this.getPage().locator('(//main//*[contains(@class, "rcx-icon--name-info-circled")])[1]/..');
	}

	public channelSettings(): Locator {
		return this.getPage().locator(
			'//aside/h3/div/i[contains(@class,"rcx-icon--name-info-circled") and contains(@class,"rcx-icon--name-info-circled")]',
		);
	}

	public channelSettingName(): Locator {
		return this.getPage().locator('.channel-settings .rc-user-info__name');
	}

	public archiveBtn(): Locator {
		return this.getPage().locator('.clearfix:last-child .icon-pencil');
	}

	public archiveRadio(): Locator {
		return this.getPage().locator('.editing');
	}

	public archiveSave(): Locator {
		return this.getPage().locator('.save');
	}

	public editNameBtn(): Locator {
		return this.getPage().locator('//aside//button[contains(text(), "Edit")]');
	}

	public editTopicBtn(): Locator {
		return this.getPage().locator('[data-edit="topic"]');
	}

	public editAnnouncementBtn(): Locator {
		return this.getPage().locator('[data-edit="announcement"]');
	}

	public editDescriptionBtn(): Locator {
		return this.getPage().locator('[data-edit="description"]');
	}

	public editNotificationBtn(): Locator {
		return this.getPage().locator('[data-edit="desktopNotifications"]');
	}

	public editMobilePushBtn(): Locator {
		return this.getPage().locator('[data-edit="mobilePushNotifications"]');
	}

	public editEmailNotificationBtn(): Locator {
		return this.getPage().locator('[data-edit="emailNotifications"]');
	}

	public editUnreadAlertBtn(): Locator {
		return this.getPage().locator('[data-edit="unreadAlert"]');
	}

	public editNameTextInput(): Locator {
		return this.getPage().locator('//aside//label[contains(text(), "Name")]/..//input');
	}

	public editTopicTextInput(): Locator {
		return this.getPage().locator('//main//aside//label[contains(text(), "Topic")]/..//textarea');
	}

	public editAnnouncementTextInput(): Locator {
		return this.getPage().locator('//main//aside//label[contains(text(), "Announcement")]/..//textarea');
	}

	public editDescriptionTextInput(): Locator {
		return this.getPage().locator('//main//aside//label[contains(text(), "Description")]/..//textarea');
	}

	public editNameSave(): Locator {
		return this.getPage().locator('//aside//button[contains(text(), "Save")]');
	}

	public deleteBtn(): Locator {
		return this.getPage().locator('.channel-settings .js-delete');
	}

	// Members Tab
	public membersTab(): Locator {
		return this.getPage().locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-members');
	}

	public membersTabContent(): Locator {
		return this.getPage().locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-members');
	}

	public userSearchBar(): Locator {
		return this.getPage().locator('//*[@placeholder="Search by username"]');
	}

	public removeUserBtn(): Locator {
		return this.getPage().locator('.remove-user');
	}

	public setOwnerBtn(): Locator {
		return this.getPage().locator('//main//aside//button[contains(text(), "Set as owner")]');
	}

	public setModeratorBtn(): Locator {
		return this.getPage().locator('[value="changeModerator"]');
	}

	public muteUserBtn(): Locator {
		return this.getPage().locator('[value="muteUser"]');
	}

	public viewAllBtn(): Locator {
		return this.getPage().locator('.button.back');
	}

	public startVideoCall(): Locator {
		return this.getPage().locator('.start-video-call');
	}

	public startAudioCall(): Locator {
		return this.getPage().locator('.start-audio-call');
	}

	public showAll(): Locator {
		return this.getPage().locator('.see-all');
	}

	public membersUserInfo(): Locator {
		return this.getPage().locator('.flex-tab-container .info');
	}

	public avatarImage(): Locator {
		return this.getPage().locator('(//aside[contains(@class, "rcx-vertical-bar")]//*[contains(@class, "avatar")])[1]');
	}

	public memberUserName(): Locator {
		return this.getPage().locator('.info h3');
	}

	public memberRealName(): Locator {
		return this.getPage().locator('[data-qa="UserInfoUserName"]');
	}

	// Search Tab
	public searchTab(): Locator {
		return this.getPage().locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-magnifier');
	}

	public searchTabContent(): Locator {
		return this.getPage().locator('.rocket-search-result');
	}

	public messageSearchBar(): Locator {
		return this.getPage().locator('#message-search');
	}

	public searchResult(): Locator {
		return this.getPage().locator('.new-day');
	}

	// Notifications Tab
	public notificationsTab(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Notifications Preferences")]');
		// return this.getPage().locator('.rcx-option__content:contains("Notifications Preferences")');
	}

	public notificationsSettings(): Locator {
		return this.getPage().locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-bell');
	}

	// Files Tab
	public filesTab(): Locator {
		return this.getPage().locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-clip');
	}

	public fileItem(): Locator {
		return this.getPage().locator('.uploaded-files-list ul:first-child');
	}

	public filesTabContent(): Locator {
		return this.getPage().locator('aside > h3 > div > i.rcx-icon--name-attachment');
	}

	public fileDelete(): Locator {
		return this.getPage().locator('.uploaded-files-list ul:first-child .file-delete');
	}

	public fileDownload(): Locator {
		return this.getPage().locator('.uploaded-files-list ul:first-child .file-download');
	}

	public fileName(): Locator {
		return this.getPage().locator('.uploaded-files-list ul:first-child .room-file-item');
	}

	// Mentions Tab
	public mentionsTab(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Mentions")]');
	}

	public mentionsTabContent(): Locator {
		return this.getPage().locator('aside > h3 > div > i.rcx-icon--name-at');
		// aside//h3//div//i[contains(@class, "i.rcx-icon--name-at")]
	}

	// Starred Tab
	public starredTab(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Starred Messages")]');
	}

	public starredTabContent(): Locator {
		return this.getPage().locator('aside > h3 > div > i.rcx-icon--name-star');
	}

	// Pinned Tab
	public pinnedTab(): Locator {
		return this.getPage().locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Pinned Messages")]');
	}

	public pinnedTabContent(): Locator {
		return this.getPage().locator('aside > h3 > div > i.rcx-icon--name-pin');
	}

	public firstSetting(): Locator {
		return this.getPage().locator('//aside//i[contains(@class, "rcx-icon--name-hashtag")]/../div');
	}

	public secondSetting(topic: string): Locator {
		return this.getPage().locator(`//header//*[contains(text(), "${topic}")]`);
	}

	public thirdSetting(): Locator {
		return this.getPage().locator('[data-qa="AnnouncementAnnoucementComponent"] div:nth-child(1)');
	}

	public fourthSetting(): Locator {
		return this.getPage().locator('//main//aside//div[contains(text(), "Description")]//following-sibling::div');
	}

	// admin view flexTab items
	public usersSendInvitationTab(): Locator {
		return this.getPage().locator('.tab-button:not(.hidden) .tab-button-icon--send');
	}

	public usersAddUserTab(): Locator {
		return this.getPage().locator('//button[text()="New"]');
	}

	public usersAddUserTabClose(): Locator {
		return this.getPage().locator('//div[text()="Add User"]//button');
	}

	public usersSendInvitationTextArea(): Locator {
		return this.getPage().locator('#inviteEmails');
	}

	public usersButtonCancel(): Locator {
		return this.getPage().locator('//button[text()="Cancel"]');
	}

	public usersSendInvitationSend(): Locator {
		return this.getPage().locator('.button.send');
	}

	public usersButtonSave(): Locator {
		return this.getPage().locator('//button[text()="Save"]');
	}

	public usersAddUserName(): Locator {
		return this.getPage().locator('//label[text()="Name"]/following-sibling::span//input');
	}

	public usersAddUserUsername(): Locator {
		return this.getPage().locator('//label[text()="Username"]/following-sibling::span//input');
	}

	public usersAddUserEmail(): Locator {
		return this.getPage().locator('//label[text()="Email"]/following-sibling::span//input').first();
	}

	public usersAddUserRoleList(): Locator {
		return this.getPage().locator('//label[text()="Roles"]/following-sibling::span//input');
	}

	public fileDescription(): Locator {
		return this.getPage().locator(
			'//li[@data-username="rocketchat.internal.admin.test"][last()]//div[@class="js-block-wrapper"]/following-sibling::div//div//p',
		);
	}

	public usersAddUserPassword(): Locator {
		return this.getPage().locator('//label[text()="Password"]/following-sibling::span//input');
	}

	public usersAddUserVerifiedCheckbox(): Locator {
		return this.getPage().locator('//label[text()="Email"]/following-sibling::span//input/following-sibling::i');
	}

	public usersAddUserChangePasswordCheckbox(): Locator {
		return this.getPage().locator('//div[text()="Require password change"]/following-sibling::label//input');
	}

	public usersAddUserDefaultChannelCheckbox(): Locator {
		return this.getPage().locator('//div[text()="Join default channels"]/following-sibling::label//input');
	}

	public usersAddUserWelcomeEmailCheckbox(): Locator {
		return this.getPage().locator('//div[text()="Send welcome email"]/following-sibling::label//input');
	}

	public usersAddUserRandomPassword(): Locator {
		return this.getPage().locator('//div[text()="Set random password and send by email"]/following-sibling::label//input');
	}

	public emojiNewAliases(): Locator {
		return this.getPage().locator('#aliases');
	}

	public emojiNewImageInput(): Locator {
		return this.getPage().locator('#image');
	}

	public usersView(): Locator {
		return this.getPage().locator('.rcx-vertical-bar:contains("User Info")');
	}

	public usersActivate(): Locator {
		return this.getPage().locator('.rcx-option__content:contains("Activate")');
	}

	public usersDeactivate(): Locator {
		return this.getPage().locator('.rcx-option__content:contains("Deactivate")');
	}

	public closeThreadMessage(): Locator {
		return this.getPage().locator(
			'//html//body//div[1]//div//div[3]//div[1]//main//div//aside//div[2]//div//div//h3//div//div[2]//button[2]',
		);
	}

	public getUserEl(username: string): Locator {
		return this.getPage().locator(`[data-qa="MemberItem-${username}"]`);
	}

	public addUserTable(): Locator {
		return this.getPage().locator('//div[text()="Add User"]');
	}

	public addUserButton(): Locator {
		return this.getPage().locator('//button[contains(text(), "Add")]');
	}

	public addUserButtonAfterChoose(): Locator {
		return this.getPage().locator('//button[contains(text(), "Add users")]');
	}

	public chooseUserSearch(): Locator {
		return this.getPage().locator('//label[contains(text(), "Choose users")]/..//input');
	}

	public chooseUserOptions(): Locator {
		return this.getPage().locator('(//div[@role="option"]//ol/li)[1]');
	}

	public userMoreActions(): Locator {
		return this.getPage().locator('[data-qa="UserUserInfo-menu"]');
	}

	public async setUserOwner(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.setOwnerBtn().waitFor();
		await this.setOwnerBtn().click();
	}

	public async setUserModerator(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.userMoreActions().click();
		await this.setModeratorBtn().waitFor();
		await this.setModeratorBtn().click();
	}

	public async muteUser(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.userMoreActions().click();
		await this.muteUserBtn().waitFor();
		await this.muteUserBtn().click();
		await this.global.confirmPopup();
		await this.mainSideBarBack().click();
	}

	public async enterUserView(user: string): Promise<void> {
		const userEl = this.getUserEl(user);
		await userEl.waitFor();
		await userEl.click();
	}

	public async archiveChannel(): Promise<void> {
		await this.archiveBtn().waitFor();
		await this.archiveBtn().click();
		await this.archiveRadio().waitFor();
		await this.archiveRadio().click();
		await this.archiveSave().click();
	}

	public async addPeopleToChannel(user: string): Promise<void> {
		await this.addUserButton().click();
		await this.chooseUserSearch().type(user);
		await this.getPage().waitForTimeout(3000);
		await this.chooseUserOptions().click();
		await this.addUserButtonAfterChoose().click();
		// await this.getPage().waitForSelector('.-autocomplete-item');
		// await this.getPage().click('.-autocomplete-item');
	}

	public async operateFlexTab(desiredTab: string, desiredState: boolean): Promise<void> {
		// desiredState true=open false=closed
		const locator: { [K: string]: Locator } = {
			channelSettings: this.channelSettings(),
			messageSearchBar: this.messageSearchBar(),
			avatarImage: this.avatarImage(),
			notificationsSettings: this.notificationsSettings(),
			filesTabContent: this.filesTabContent(),
			mentionsTabContent: this.mentionsTabContent(),
			starredTabContent: this.starredTabContent(),
			pinnedTabContent: this.pinnedTabContent(),
			channelTab: this.channelTab(),
			searchTab: this.searchTab(),
			membersTab: this.membersTab(),
			notificationsTab: this.notificationsTab(),
			filesTab: this.filesTab(),
			mentionsTab: this.mentionsTab(),
			starredTab: this.starredTab(),
			pinnedTab: this.pinnedTab(),
		};

		const operate = async (tab: string, panel: string, more: boolean): Promise<void> => {
			// this[panel].should(!desiredState ? 'be.visible' : 'not.exist');
			if (!desiredState) {
				await expect(locator[panel]).toBeVisible();
			} else {
				await expect(locator[panel]).not.toBeVisible();
			}

			if (more) {
				await this.headerMoreActions().click();
			}

			await locator[tab].click();

			// The button "more" keeps the focus when popover is closed from a click
			// on an item, need to click again to change the status to unselected and
			// allow the next click to open the popover again
			if (more) {
				await this.headerMoreActions().click();
			}

			if (desiredState) {
				await expect(locator[panel]).toBeVisible();
			} else {
				await expect(locator[panel]).not.toBeVisible();
			}
		};

		const tabs: { [K: string]: Function } = {
			info: async (): Promise<void> => {
				await operate('channelTab', 'channelSettings', false);
			},

			search: async (): Promise<void> => {
				await operate('searchTab', 'messageSearchBar', false);
			},

			members: async (): Promise<void> => {
				await operate('membersTab', 'avatarImage', false);
			},

			notifications: async (): Promise<void> => {
				await operate('notificationsTab', 'notificationsSettings', true);
			},

			files: async (): Promise<void> => {
				await operate('filesTab', 'filesTabContent', false);
			},

			mentions: async (): Promise<void> => {
				await operate('mentionsTab', 'mentionsTabContent', true);
			},

			starred: async (): Promise<void> => {
				await operate('starredTab', 'starredTabContent', true);
			},

			pinned: async (): Promise<void> => {
				await operate('pinnedTab', 'pinnedTabContent', true);
			},
		};

		const callFunctionTabs = async (name: string): Promise<void> => {
			return tabs[name]();
		};

		await callFunctionTabs(desiredTab);
	}

	public flexTabViewThreadMessage(): Locator {
		return this.getPage().locator(
			'div.thread-list.js-scroll-thread ul.thread [data-qa-type="message"]:last-child div.message-body-wrapper [data-qa-type="message-body"]',
		);
	}

	public async doAddRole(role: string): Promise<void> {
		await this.usersAddUserRoleList().click();
		await this.getPage().locator(`li[value=${role}]`).click();
	}
}

export default FlexTab;
