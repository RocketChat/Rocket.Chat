import { Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class FlexTab extends BasePage {
	get mainSideBar(): Locator {
		return this.page.locator('//main//aside');
	}

	get mainSideBarBack(): Locator {
		return this.page.locator('(//main//aside/h3//button)[1]');
	}

	get mainSideBarClose(): Locator {
		return this.page.locator('//main//aside/h3//i[contains(@class, "rcx-icon--name-cross")]/..');
	}

	get messageInput(): Locator {
		return this.page.locator('.rcx-vertical-bar .js-input-message');
	}

	get btnTabInfo(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-info-circled]');
	}

	get btnTabSearch(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-magnifier]');
	}

	get btnTabMembers(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-members]');
	}

	get btnTabNotifications(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Notifications Preferences")]');
	}

	get btnTabFiles(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-clip]');
	}

	get btnTabMentions(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Mentions")]');
	}

	get btnTabStared(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Starred Messages")]');
	}

	get btnTabPinned(): Locator {
		return this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Pinned Messages")]');
	}

	get contentTabInfo(): Locator {
		return this.page.locator(
			'//aside/h3/div/i[contains(@class,"rcx-icon--name-info-circled") and contains(@class,"rcx-icon--name-info-circled")]',
		);
	}

	get contentTabMembers(): Locator {
		return this.page.locator('[data-qa-id=RoomHeader-Members]');
	}

	get contentTabNotifications(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-box--full.rcx-icon--name-bell');
	}

	get contentTabSearch(): Locator {
		return this.page.locator('#message-search');
	}

	get contentTabFiles(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-attachment');
	}

	get contentTabMentions(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-at');
	}

	get contentTabStared(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-star');
	}

	get contentTabPinned(): Locator {
		return this.page.locator('aside > h3 > div > i.rcx-icon--name-pin');
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

	get setOwnerBtn(): Locator {
		return this.page.locator('//main//aside//button[contains(text(), "Set as owner")]');
	}

	get setModeratorBtn(): Locator {
		return this.page.locator('[value="changeModerator"]');
	}

	get muteUserBtn(): Locator {
		return this.page.locator('[value="muteUser"]');
	}

	get userUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}

	get searchResult(): Locator {
		return this.page.locator('.new-day');
	}

	get fileDownload(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .file-download');
	}

	get fileName(): Locator {
		return this.page.locator('.uploaded-files-list ul:first-child .room-file-item');
	}

	get firstSetting(): Locator {
		return this.page.locator('//aside//i[contains(@class, "rcx-icon--name-hashtag")]/../div');
	}

	secondSetting(topic: string): Locator {
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

	getUserEl(username: string): Locator {
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

	async setUserOwner(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.setOwnerBtn.waitFor();
		await this.setOwnerBtn.click();
	}

	async setUserModerator(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.userMoreActions.click();
		await this.setModeratorBtn.waitFor();
		await this.setModeratorBtn.click();
	}

	async muteUser(user: string): Promise<void> {
		await this.enterUserView(user);
		await this.userMoreActions.click();
		await this.muteUserBtn.waitFor();
		await this.muteUserBtn.click();
		await this.page.locator('.rcx-modal .rcx-button--danger').click();
		await this.mainSideBarBack.click();
	}

	async enterUserView(user: string): Promise<void> {
		const userEl = this.getUserEl(user);
		await userEl.waitFor();
		await userEl.click();
	}

	async addPeopleToChannel(user: string): Promise<void> {
		await this.addUserButton.click();
		await this.chooseUserSearch.type(user);
		await this.page.waitForTimeout(3000);
		await this.chooseUserOptions.click();
		await this.addUserButtonAfterChoose.click();
	}

	get flexTabViewThreadMessage(): Locator {
		return this.page.locator(
			'div.thread-list.js-scroll-thread ul.thread [data-qa-type="message"]:last-child div.message-body-wrapper [data-qa-type="message-body"]',
		);
	}

	async doAddRole(role: string): Promise<void> {
		await this.usersAddUserRoleList.click();
		await this.page.locator(`li[value=${role}]`).click();
	}

	async doOpenMoreOptionMenu(): Promise<void> {
		await this.page.locator('[data-qa-id=ToolBox-Menu]').click({ force: true, clickCount: 3 });
	}
}
