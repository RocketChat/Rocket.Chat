import { Locator, expect } from '@playwright/test';

import BasePage from './BasePage';

export default class Discussion extends BasePage {
	public startDiscussionContextItem(): Locator {
		return this.getPage().locator('[data-qa-id="start-discussion"][data-qa-type="message-action"]');
	}

	public createDiscussionBtn(): Locator {
		return this.getPage().locator('.rcx-option__content >> text="Discussion"');
	}

	public channelName(): Locator {
		return this.getPage().locator('.rcx-input-box--undecorated.rcx-input-box').first();
	}

	public discussionName(): Locator {
		return this.getPage().locator('[placeholder="A meaningful name for the discussion room"]');
	}

	public discussionMessage(): Locator {
		return this.getPage().locator('textarea.rcx-input-box');
	}

	public buttonCreateDiscussion(): Locator {
		return this.getPage().locator('button.rcx-button--primary.rcx-button >> text="Create"');
	}

	public discussionCreated(discussionName: string): Locator {
		return this.getPage().locator(`[data-qa="sidebar-item-title"] >> text='${discussionName}'`);
	}

	async createDiscussion(channelName: string, discussionName: string, message: string): Promise<void> {
		await this.createDiscussionBtn().click();
		await this.channelName().type(channelName);
		await this.getPage().keyboard.press('Enter');

		await this.discussionName().type(discussionName);
		await this.discussionMessage().type(message);

		await this.buttonCreateDiscussion().click();

		await expect(this.discussionCreated(discussionName)).toBeVisible();
	}

	async createDiscussionInContext(message: string): Promise<void> {
		await this.startDiscussionContextItem().waitFor();
		await this.getPage().pause();
		await this.startDiscussionContextItem().click();
		await this.buttonCreateDiscussion().click();
		await expect(this.discussionCreated(message)).toBeVisible();
	}
}
