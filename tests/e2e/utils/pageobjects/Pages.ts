import { Browser, Page } from '@playwright/test';

class Pages {
	protected page: Page;

	constructor(protected readonly browser: Browser, protected readonly baseURL: string) {}

	public async open(path: string): Promise<void> {
		const context = await this.browser.newContext();
		this.page = await context.newPage();
		this.page.setDefaultNavigationTimeout(50000);
		await this.goto(path);
	}

	// TODO remover
	public async pause(): Promise<void> {
		await this.page.pause();
	}

	public async goto(path: string): Promise<void> {
		await this.page.goto(`${this.baseURL}/${path}`);
	}
}
export default Pages;
