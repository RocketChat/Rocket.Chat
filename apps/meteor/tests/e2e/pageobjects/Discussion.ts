import { Locator, expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class Discussion extends BasePage {
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

	public discussionCreated(discussionName: string): Locator {
		return this.page.locator(`[data-qa="sidebar-item-title"] >> text='${discussionName}'`);
	}

	async createDiscussion(channelName: string, discussionName: string, message: string): Promise<void> {
		await this.createDiscussionBtn.click();
		await this.channelName.type(channelName);
		await this.page.keyboard.press('Enter');

		await this.discussionName.type(discussionName);
		await this.discussionMessage.type(message);

		await this.buttonCreateDiscussion.click();

		await expect(this.discussionCreated(discussionName)).toBeVisible();
	}

	async createDiscussionInContext(message: string): Promise<void> {
		await this.startDiscussionContextItem.waitFor();
		await this.page.pause();
		await this.startDiscussionContextItem.click();
		await this.buttonCreateDiscussion.click();
		await expect(this.discussionCreated(message)).toBeVisible();
	}
}
