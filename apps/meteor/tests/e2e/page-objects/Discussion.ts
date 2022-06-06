import { Locator, expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class Discussion extends BasePage {
	get btnStartDiscussionContextItem(): Locator {
		return this.page.locator('[data-qa-id="start-discussion"][data-qa-type="message-action"]');
	}

	get btnDiscussion(): Locator {
		return this.page.locator('.rcx-option__content >> text="Discussion"');
	}

	get inputChannelName(): Locator {
		return this.page.locator('.rcx-input-box--undecorated.rcx-input-box').first();
	}

	get inputDiscussionName(): Locator {
		return this.page.locator('[placeholder="A meaningful name for the discussion room"]');
	}

	get inputDiscussionMessage(): Locator {
		return this.page.locator('textarea.rcx-input-box');
	}

	get btnCreateDiscussion(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Create"');
	}

	getTextDiscussion(discussionName: string): Locator {
		return this.page.locator(`[data-qa="sidebar-item-title"] >> text='${discussionName}'`);
	}

	async createDiscussion(channelName: string, discussionName: string, message: string): Promise<void> {
		await this.btnDiscussion.click();
		await this.inputChannelName.type(channelName);
		await this.page.keyboard.press('Enter');

		await this.inputDiscussionName.type(discussionName);
		await this.inputDiscussionMessage.type(message);

		await this.btnCreateDiscussion.click();

		await expect(this.getTextDiscussion(discussionName)).toBeVisible();
	}

	async createDiscussionInContext(message: string): Promise<void> {
		await this.btnStartDiscussionContextItem.click();
		await this.btnCreateDiscussion.click();
		await expect(this.getTextDiscussion(message)).toBeVisible();
	}
}
