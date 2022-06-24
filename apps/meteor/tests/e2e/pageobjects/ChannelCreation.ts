import { BasePage } from './BasePage';

export class ChannelCreation extends BasePage {
	// TODO: replace old selectors with data-qa-id
	async doCreateChannel(name: string, isPrivate = false): Promise<void> {
		await this.page.locator('[data-qa="sidebar-create"]').click();
		await this.page.locator('//ul[@class="rc-popover__list"]//li[@class="rcx-option"][1]').click();
		await this.page.locator('[placeholder="Channel Name"]').type(name);
		await this.page.locator('[placeholder="What is this channel about?"]').type('any_description');

		if (!isPrivate) {
			await this.page.locator('//label[contains(text(),"Private")]/../following-sibling::label/i').click();
		}

		await this.page.locator('//button[contains(text(), "Create" )]').click();
	}
}
