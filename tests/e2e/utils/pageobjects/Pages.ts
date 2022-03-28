import { resolve } from 'path';

import { Browser, Page } from '@playwright/test';

class Pages {
	protected page: Page;

	protected browser: Browser;

	protected baseURL: string;

	constructor(browser: Browser, baseURL = '') {
		this.browser = browser;
		this.baseURL = baseURL;
	}

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

	protected getPage(): Page {
		return this.page;
	}

	public async isSetUpWizzard(): Promise<boolean> {
		await this.page.waitForURL('**/setup-wizard');

		return !!this.page.url().match(/.*\/setup-wizard/);
	}
}
export default Pages;
