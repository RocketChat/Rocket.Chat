import { Page, Locator } from '@playwright/test';

class BasePage {
	private page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	public getPage(): Page {
		return this.page;
	}

	public async goto(path: string): Promise<void> {
		await this.getPage().goto(path);
	}

	public async waitForSelector(selector: string): Promise<void> {
		await this.getPage().waitForSelector(selector);
	}

	public async keyboardPress(key: string): Promise<void> {
		await this.getPage().keyboard.press(key);
	}

	public modal(): Locator {
		return this.getPage().locator('#modal-root');
	}

	public btnModalCancel(): Locator {
		return this.getPage().locator(
			'#modal-root div dialog div.rcx-modal__inner div.rcx-modal__footer div div button.rcx-button--ghost.rcx-button',
		);
	}

	public btnModalRemove(): Locator {
		return this.getPage().locator(
			'#modal-root div dialog div.rcx-modal__inner div.rcx-modal__footer div div button.rcx-button--primary-danger.rcx-button',
		);
	}
}
export default BasePage;
