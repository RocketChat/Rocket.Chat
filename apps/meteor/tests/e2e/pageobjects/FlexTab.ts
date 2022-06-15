import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { Global } from './Global';

export class FlexTab extends BasePage {
	private global: Global;

	constructor(page: Page) {
		super(page);
		this.global = new Global(page);
	}

	get mainSideBar(): Locator {
		return this.page.locator('//main//aside');
	}

	get mainSideBarBack(): Locator {
		return this.page.locator('(//main//aside/h3//button)[1]');
	}

	get mainSideBarClose(): Locator {
		return this.page.locator('//main//aside/h3//i[contains(@class, "rcx-icon--name-cross")]/..');
	}

	get headerMoreActions(): Locator {
		return this.page.locator('//main/header//*[contains(@class, "rcx-icon--name-kebab")]/..');
	}

	get messageInput(): Locator {
		return this.page.locator('.rcx-vertical-bar .js-input-message');
	}

	get channelTab(): Locator {
		return this.page.locator('(//main//*[contains(@class, "rcx-icon--name-info-circled")])[1]/..');
	}

	get channelSettings(): Locator {
		return this.page.locator(
			'//aside/h3/div/i[contains(@class,"rcx-icon--name-info-circled") and contains(@class,"rcx-icon--name-info-circled")]',
		);
	}

	get editNameBtn(): Locator {
		return this.page.locator('//aside//button[contains(text(), "Edit")]');
	}

	get editUnreadAlertBtn(): Locator {
		return this.page.locator('[data-edit="unreadAlert"]');
	}

	get editNameTextInput(): Locator {
		return this.page.locator('//aside//label[contains(text(), "Name")]/..//input');
	}

	get editTopicTextInput(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Topic")]/..//textarea');
	}

	get editAnnouncementTextInput(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Announcement")]/..//textarea');
	}

	get editDescriptionTextInput(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Description")]/..//textarea');
	}

	get editNameSave(): Locator {
		return this.page.locator('//aside//button[contains(text(), "Save")]');
	}

	get membersTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-members');
	}

	get membersTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-members');
	}

	get setOwnerBtn(): Locator {
		return this.page.locator('//main//aside//button[contains(text(), "Set as owner")]');
	}

	get setModeratorBtn(): Locator {
		return this.page.locator('[value="changeModerator"]');
	}

	get muteUserBtn(): Locator {
		return this.page.locator('[value="muteUser"]');
	}

	get avatarImage(): Locator {
		return this.page.locator('(//aside[contains(@class, "rcx-vertical-bar")]//*[contains(@class, "avatar")])[1]');
	}

	get memberRealName(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}

	get searchTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-magnifier');
	}

	get searchTabContent(): Locator {
		return this.page.locator('.rocket-search-result');
	}

	get messageSearchBar(): Locator {
		return this.page.locator('#message-search');
	}

	get searchResult(): Locator {
		return this.page.locator('.new-day');
	}

	get notificationsTab(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Notifications Preferences")]');
	}

	get notificationsSettings(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-bell');
	}

	get filesTab(): Locator {
		return this.page.locator('.rcx-room-header .rcx-button-group__item:not(.hidden) .rcx-icon--name-clip');
	}

	get filesTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-attachment');
	}

	get fileDownload(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .file-download');
	}

	get fileName(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .room-file-item');
	}

	get mentionsTab(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Mentions")]');
	}

	get mentionsTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-at');
	}

	get starredTab(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Starred Messages")]');
	}

	get starredTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-star');
	}

	get pinnedTab(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Pinned Messages")]');
	}

	get pinnedTabContent(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-pin');
	}

	get firstSetting(): Locator {
		return this.page.locator('//aside//i[contains(@class, "rcx-icon--name-hashtag")]/../div');
	}

	public secondSetting(topic: string): Locator {
		return this.page.locator(`//header//*[contains(text(), "${topic}")]`);
	}

	get thirdSetting(): Locator {
		return this.page.locator('[data-qa="AnnouncementAnnoucementComponent"] div:nth-child(1)');
	}

	get fourthSetting(): Locator {
		return this.page.locator('//main//aside//div[contains(text(), "Description")]//following-sibling::div');
	}

	get usersAddUserTab(): Locator {
		return this.page.locator('//button[text()="New"]');
	}

	get usersAddUserTabClose(): Locator {
		return this.page.locator('//div[text()="Add User"]//button');
	}

	get usersButtonCancel(): Locator {
		return this.page.locator('//button[text()="Cancel"]');
	}

	get usersButtonSave(): Locator {
		return this.page.locator('//button[text()="Save"]');
	}

	get usersAddUserName(): Locator {
		return this.page.locator('//label[text()="Name"]/following-sibling::span//input');
	}

	get usersAddUserUsername(): Locator {
		return this.page.locator('//label[text()="Username"]/following-sibling::span//input');
	}

	get usersAddUserEmail(): Locator {
		return this.page.locator('//label[text()="Email"]/following-sibling::span//input').first();
	}

	get usersAddUserRoleList(): Locator {
		return this.page.locator('//label[text()="Roles"]/following-sibling::span//input');
	}

	get fileDescription(): Locator {
		return this.page.locator(
			'//li[@data-username="rocketchat.internal.admin.test"][last()]//div[@class="js-block-wrapper"]/following-sibling::div//div//p',
		);
	}

	get usersAddUserPassword(): Locator {
		return this.page.locator('//label[text()="Password"]/following-sibling::span//input');
	}

	get usersAddUserVerifiedCheckbox(): Locator {
		return this.page.locator('//label[text()="Email"]/following-sibling::span//input/following-sibling::i');
	}

	get usersAddUserChangePasswordCheckbox(): Locator {
		return this.page.locator('//div[text()="Require password change"]/following-sibling::label//input');
	}

	get usersAddUserDefaultChannelCheckbox(): Locator {
		return this.page.locator('//div[text()="Join default channels"]/following-sibling::label//input');
	}

	get usersAddUserWelcomeEmailCheckbox(): Locator {
		return this.page.locator('//div[text()="Send welcome email"]/following-sibling::label//input');
	}

	get usersAddUserRandomPassword(): Locator {
		return this.page.locator('//div[text()="Set random password and send by email"]/following-sibling::label//input');
	}

	get closeThreadMessage(): Locator {
		return this.page.locator('//html//body//div[1]//div//div[3]//div[1]//main//div//aside//div[2]//div//div//h3//div//div[2]//button[2]');
	}

	public getUserEl(username: string): Locator {
		return this.page.locator(`[data-qa="MemberItem-${username}"]`);
	}

	get addUserTable(): Locator {
		return this.page.locator('//div[text()="Add User"]');
	}

	get addUserButton(): Locator {
		return this.page.locator('//button[contains(text(), "Add")]');
	}

	get addUserButtonAfterChoose(): Locator {
		return this.page.locator('//button[contains(text(), "Add users")]');
	}

	get chooseUserSearch(): Locator {
		return this.page.locator('//label[contains(text(), "Choose users")]/..//input');
	}

	get chooseUserOptions(): Locator {
		return this.page.locator('(//div[@role="option"]//ol/li)[1]');
	}

	get userMoreActions(): Locator {
		return this.page.locator('[data-qa="UserUserInfo-menu"]');
	}

	public async setUserOwner(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.setOwnerBtn.waitFor();
		await this.setOwnerBtn.click();
	}

	public async setUserModerator(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.userMoreActions.click();
		await this.setModeratorBtn.waitFor();
		await this.setModeratorBtn.click();
	}

	public async muteUser(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.userMoreActions.click();
		await this.muteUserBtn.waitFor();
		await this.muteUserBtn.click();
		await this.global.confirmPopup();
		await this.mainSideBarBack.click();
	}

	public async enterUserView(user: string): Promise<void> {
		const userEl = this.getUserEl(user);
		await userEl.waitFor();
		await userEl.click();
	}

	public async addPeopleToChannel(user: string): Promise<void> {
		await this.addUserButton.click();
		await this.chooseUserSearch.type(user);
		await this.page.waitForTimeout(3000);
		await this.chooseUserOptions.click();
		await this.addUserButtonAfterChoose.click();
	}

	public async operateFlexTab(desiredTab: string, desiredState: boolean): Promise<void> {
		// desiredState true=open false=closed
		const locator: { [K: string]: Locator } = {
			channelSettings: this.channelSettings,
			messageSearchBar: this.messageSearchBar,
			avatarImage: this.avatarImage,
			notificationsSettings: this.notificationsSettings,
			filesTabContent: this.filesTabContent,
			mentionsTabContent: this.mentionsTabContent,
			starredTabContent: this.starredTabContent,
			pinnedTabContent: this.pinnedTabContent,
			channelTab: this.channelTab,
			searchTab: this.searchTab,
			membersTab: this.membersTab,
			notificationsTab: this.notificationsTab,
			filesTab: this.filesTab,
			mentionsTab: this.mentionsTab,
			starredTab: this.starredTab,
			pinnedTab: this.pinnedTab,
		};

		const operate = async (tab: string, panel: string, more: boolean): Promise<void> => {
			// this[panel].should(!desiredState ? 'be.visible' : 'not.exist');
			if (!desiredState) {
				await expect(locator[panel]).toBeVisible();
			} else {
				await expect(locator[panel]).not.toBeVisible();
			}

			if (more) {
				await this.headerMoreActions.click();
			}

			await locator[tab].click();

			// The button "more" keeps the focus when popover is closed from a click
			// on an item, need to click again to change the status to unselected and
			// allow the next click to open the popover again
			if (more) {
				await this.headerMoreActions.click();
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

	get flexTabViewThreadMessage(): Locator {
		return this.page.locator(
			'div.thread-list.js-scroll-thread ul.thread [data-qa-type="message"]:last-child div.message-body-wrapper [data-qa-type="message-body"]',
		);
	}

	public async doAddRole(role: string): Promise<void> {
		await this.usersAddUserRoleList.click();
		await this.page.locator(`li[value=${role}]`).click();
	}
}
