import { Locator, Page } from '@playwright/test';

import { HomeContent, HomeSidebar, HomeFlextab } from './fragments';

export class HomeChannel {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidebar: HomeSidebar;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;

		this.content = new HomeContent(page);
		this.sidebar = new HomeSidebar(page);
		this.tabs = new HomeFlextab(page);
	}

	get btnModalCancel(): Locator {
		return this.page.locator('.rcx-toastbar').locator('button')
	}

	get btnModalConfirm(): Locator {
		return this.page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary');	
	}

	get inputFileName(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[1]//label');
	}

	get inputFileDescription(): Locator {
		return this.page.locator('//div[@id="modal-root"]//fieldset//div[2]//label');
	}
}
