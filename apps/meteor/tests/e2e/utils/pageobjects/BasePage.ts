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

	get toastSuccess(): Locator {
		return this.getPage().locator('#toast-container');
	}
}
export default BasePage;
