import { Locator, Page } from '@playwright/test';

export class HomeFlextab {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}

	get btnTabMembers(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-members]');
	}

	get editNameBtn(): Locator {
		return this.page.locator('//aside//button[contains(text(), "Edit")]');
	}

	get btnTabInfo(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-info-circled]');
	}

	get mainSideBar(): Locator {
		return this.page.locator('//main//aside');
	}

	get mainSideBarClose(): Locator {
		return this.page.locator('//main//aside/h3//i[contains(@class, "rcx-icon--name-cross")]/..');
	}

	get editTopicTextInput(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Topic")]/..//textarea');
	}

	get editNameSave(): Locator {
		return this.page.locator('//aside//button[contains(text(), "Save")]');
	}

	secondSetting(topic: string): Locator {
		return this.page.locator(`//header//*[contains(text(), "${topic}")]`);
	}

	get editAnnouncementTextInput(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Announcement")]/..//textarea');
	}

	get thirdSetting(): Locator {
		return this.page.locator('[data-qa="AnnouncementAnnoucementComponent"] div:nth-child(1)');
	}

	get editDescriptionTextInput(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Description")]/..//textarea');
	}

	get mainSideBarBack(): Locator {
		return this.page.locator('(//main//aside/h3//button)[1]');
	}

	get fourthSetting(): Locator {
		return this.page.locator('//main//aside//div[contains(text(), "Description")]//following-sibling::div');
	}

	get firstSetting(): Locator {
		return this.page.locator('//aside//i[contains(@class, "rcx-icon--name-hashtag")]/../div');
	}

	get editNameTextInput(): Locator {
		return this.page.locator('//aside//label[contains(text(), "Name")]/..//input');
	}

	get messageInput(): Locator {
		return this.page.locator('.rcx-vertical-bar .js-input-message');
	}

	get flexTabViewThreadMessage(): Locator {
		return this.page.locator(
			'div.thread-list.js-scroll-thread ul.thread [data-qa-type="message"]:last-child div.message-body-wrapper [data-qa-type="message-body"]',
		);
	}

	get closeThreadMessage(): Locator {
		return this.page.locator('//html//body//div[1]//div//div[3]//div[1]//main//div//aside//div[2]//div//div//h3//div//div[2]//button[2]');
	}

	async doAddPeopleToChannel(user: string): Promise<void> {
		await this.page.locator('//button[contains(text(), "Add")]').click();
		await this.page.locator('//label[contains(text(), "Choose users")]/..//input').type(user);
		await this.page.waitForTimeout(3000);
		await this.page.locator('[data-qa-type="autocomplete-user-option"]').click();
		await this.page.locator('//button[contains(text(), "Add users")]').click();
	}

	async doMuteUser(username: string): Promise<void> {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
		await this.page.locator('[data-qa="UserUserInfo-menu"]').click();
		await this.page.locator('[value="muteUser"]').click();
		await this.page.locator('.rcx-modal .rcx-button--danger').click();
		await this.page.locator('(//main//aside/h3//button)[1]').click();
	}

	async doSetUserOwner(username: string): Promise<void> {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
		await this.page.locator('//main//aside//button[contains(text(), "Set as owner")]').click();
	}

	async doSetUserModerator(username: string): Promise<void> {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
		await this.page.locator('[data-qa="UserUserInfo-menu"]').click();
		await this.page.locator('[value="changeModerator"]').click();
	}
}
