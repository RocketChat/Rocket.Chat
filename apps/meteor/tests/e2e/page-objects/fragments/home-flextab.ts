import { Page, Locator } from '@playwright/test';

export class HomeFlextab {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnMembers(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-members"]');
	}

	get btnAddMember(): Locator {
		return this.page.locator('//button[contains(text(), "Add")]');
	}

	get inputChooseMember(): Locator {
		return this.page.locator('//label[contains(text(), "Choose users")]/..//input');
	}

	get firstOptionChooseMember(): Locator {
		return this.page.locator('[data-qa-type="autocomplete-user-option"]');
	}

	get btnAddChosenMember(): Locator {
		return this.page.locator('//button[contains(text(), "Add users")]');
	}

	get userInfoUsername(): Locator {
		return this.page.locator('[data-qa="UserInfoUserName"]');
	}

	getMember(name: string): Locator {
		return this.page.locator(`[data-qa="MemberItem-${name}"]`);
	}

	get btnChannelInfo(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-info-circled"]');
	}

	get btnChannelInfoEdit(): Locator {
		return this.page.locator('.rcx-button >> text="Edit"');
	}

	get inputChannelName(): Locator {
		return this.page.locator('//aside//label[contains(text(), "Name")]/..//input');
	}

	get inputChannelAnnouncement(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Announcement")]/..//textarea');
	}

	get btnEditSave(): Locator {
		return this.page.locator('//aside//button[contains(text(), "Save")]');
	}

	get inputChannelDescription(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Description")]/..//textarea');
	}

	get memberInfoMenu(): Locator {
		return this.page.locator('[data-qa="UserUserInfo-menu"]');
	}

	get btnMuteMember(): Locator {
		return this.page.locator('[value="muteUser"]');
	}

	get btnSetMemberOwner(): Locator {
		return this.page.locator('//main//aside//button[contains(text(), "Set as owner")]');
	}

	get btnSetMemberModerator(): Locator {
		return this.page.locator('[value="changeModerator"]');
	}
}
