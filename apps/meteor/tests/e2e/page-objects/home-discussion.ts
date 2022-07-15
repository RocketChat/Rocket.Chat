import { Locator, Page, expect } from '@playwright/test';

import { HomeContent, HomeSidenav, HomeFlextab } from './fragments';

export class HomeDiscussion {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;

		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
	}

	get startDiscussionContextItem(): Locator {
		return this.page.locator('[data-qa-id="start-discussion"][data-qa-type="message-action"]');
	}

	get createDiscussionBtn(): Locator {
		return this.page.locator('.rcx-option__content >> text="Discussion"');
	}

	get channelName(): Locator {
		return this.page.locator('.rcx-input-box--undecorated.rcx-input-box').first();
	}

	get discussionName(): Locator {
		return this.page.locator('[placeholder="A meaningful name for the discussion room"]');
	}

	get discussionMessage(): Locator {
		return this.page.locator('textarea.rcx-input-box');
	}

	get buttonCreateDiscussion(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Create"');
	}

	discussionCreated(discussionName: string): Locator {
		return this.page.locator(`[data-qa="sidebar-item-title"] >> text='${discussionName}'`);
	}

	async doCreateDiscussion(channelName: string, discussionName: string, message: string): Promise<void> {
		await this.createDiscussionBtn.click();
		await this.channelName.type(channelName);
		await this.page.keyboard.press('Enter');

		await this.discussionName.type(discussionName);
		await this.discussionMessage.type(message);

		await this.buttonCreateDiscussion.click();

		await expect(this.discussionCreated(discussionName)).toBeVisible();
	}

	async doCreateDiscussionInContext(message: string): Promise<void> {
		await this.startDiscussionContextItem.waitFor();
		await this.page.pause();
		await this.startDiscussionContextItem.click();
		await this.buttonCreateDiscussion.click();
		await expect(this.discussionCreated(message)).toBeVisible();
	}
}
