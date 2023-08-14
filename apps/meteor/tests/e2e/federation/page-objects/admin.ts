import type { Locator, Page } from '@playwright/test';

import { FederationAdminFlextab } from './fragments/admin-flextab';

export class FederationAdmin {
	private readonly page: Page;

	readonly tabs: FederationAdminFlextab;

	constructor(page: Page) {
		this.page = page;
		this.tabs = new FederationAdminFlextab(page);
	}

	get inputSearchRooms(): Locator {
		return this.page.locator('input[placeholder ="Search rooms"]');
	}

	get inputSearchUsers(): Locator {
		return this.page.locator('input[placeholder="Search Users"]');
	}

	get inputSearchSettings(): Locator {
		return this.page.locator('input[type=search]');
	}

	get roomsInputName(): Locator {
		return this.page.locator('//label[text()="Name"]/following-sibling::span//input');
	}

	get roomsInputDescription(): Locator {
		return this.page.locator('//label[text()="Description"]/following-sibling::span//textarea');
	}

	get roomsInputAnnouncement(): Locator {
		return this.page.locator('//label[text()="Announcement"]/following-sibling::span//textarea');
	}

	get roomsInputTopic(): Locator {
		return this.page.locator('//label[text()="Topic"]/following-sibling::span//textarea');
	}

	get roomsInputFavorite(): Locator {
		return this.page.locator('//label[text()="Favorite"]/following-sibling::span//input/following-sibling::i');
	}

	get roomsInputPrivate(): Locator {
		return this.page.locator('//label[text()="Private"]/following-sibling::span//input/following-sibling::i');
	}

	get roomsInputReadOnly(): Locator {
		return this.page.locator('//label[text()="Read Only"]/following-sibling::span//input/following-sibling::i');
	}

	get roomsInputArchived(): Locator {
		return this.page.locator('//label[text()="Archived"]/following-sibling::span//input/following-sibling::i');
	}

	get roomsInputDefault(): Locator {
		return this.page.locator('//label[text()="Default"]/following-sibling::span//input/following-sibling::i');
	}

	get roomsInputFeatured(): Locator {
		return this.page.locator('//label[text()="Featured"]/following-sibling::span//input/following-sibling::i');
	}

	get roomsBtnDelete(): Locator {
		return this.page.locator('//button[text()="Delete"]');
	}

	get roomsBtnUploadAvatar(): Locator {
		return this.page.locator('//button[text()="Upload"]');
	}

	get roomsBtnDefaultAvatar(): Locator {
		return this.page.locator('button[title="Set Default Avatar"]');
	}
}
