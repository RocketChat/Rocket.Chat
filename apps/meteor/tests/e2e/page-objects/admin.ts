import type { Locator, Page } from '@playwright/test';

import { AdminFlextab } from './fragments/admin-flextab';

export class Admin {
	public readonly page: Page;

	readonly tabs: AdminFlextab;

	constructor(page: Page) {
		this.page = page;
		this.tabs = new AdminFlextab(page);
	}

	get inputSearchRooms(): Locator {
		return this.page.locator('input[placeholder ="Search rooms"]');
	}

	getRoomRow(name?: string): Locator {
		return this.page.locator('[role="link"]', { hasText: name });
	}

	get btnSave(): Locator {
		return this.page.locator('button >> text="Save"');
	}

	get privateLabel(): Locator {
		return this.page.locator(`label >> text=Private`);
	}

	get privateInput(): Locator {
		return this.page.locator('input[name="roomType"]');
	}

	get roomNameInput(): Locator {
		return this.page.locator('input[name="roomName"]');
	}

	get roomOwnerInput(): Locator {
		return this.page.locator('input[name="roomOwner"]');
	}

	get archivedLabel(): Locator {
		return this.page.locator('label >> text=Archived');
	}

	get archivedInput(): Locator {
		return this.page.locator('input[name="archived"]');
	}

	get favoriteLabel(): Locator {
		return this.page.locator('label >> text=Favorite');
	}

	get favoriteInput(): Locator {
		return this.page.locator('input[name="favorite"]');
	}

	get defaultLabel(): Locator {
		return this.page.locator('label >> text=Default');
	}

	get defaultInput(): Locator {
		return this.page.locator('input[name="isDefault"]');
	}

	get inputSearchUsers(): Locator {
		return this.page.locator('input[placeholder="Search Users"]');
	}

	get inputSearchSettings(): Locator {
		return this.page.locator('input[type=search]');
	}

	get inputSiteURL(): Locator {
		return this.page.locator('[data-qa-setting-id="Site_Url"]');
	}

	get btnResetSiteURL(): Locator {
		return this.page.locator('//label[@title="Site_Url"]//following-sibling::button');
	}

	get inputSiteName(): Locator {
		return this.page.locator('[data-qa-setting-id="Site_Name"]');
	}

	get btnResetSiteName(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Site_Name"]');
	}

	get btnAllowInvalidSelfSignedCerts(): Locator {
		return this.page.locator('//label[@data-qa-setting-id="Allow_Invalid_SelfSigned_Certs"]//i');
	}

	get btnResetAllowInvalidSelfSignedCerts(): Locator {
		return this.page.locator('//button[@data-qa-reset-setting-id="Allow_Invalid_SelfSigned_Certs"]');
	}

	get btnEnableFavoriteRooms(): Locator {
		return this.page.locator('[data-qa-setting-id="Favorite_Rooms"]');
	}

	get btnResetEnableFavoriteRooms(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Favorite_Rooms"]');
	}

	get btnUseCDNPrefix(): Locator {
		return this.page.locator('[data-qa-setting-id="CDN_PREFIX_ALL"]');
	}

	get btnResetUseCDNPrefix(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="CDN_PREFIX_ALL"]');
	}

	get btnForceSSL(): Locator {
		return this.page.locator('[data-qa-setting-id="Force_SSL"]');
	}

	get btnResetForceSSL(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Force_SSL"]');
	}

	get inputGoogleTagManagerId(): Locator {
		return this.page.locator('[data-qa-setting-id="GoogleTagManager_id"]');
	}

	get btnResetGoogleTagManagerId(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="GoogleTagManager_id"]');
	}

	get inputBugsnagApiKey(): Locator {
		return this.page.locator('[data-qa-setting-id="Bugsnag_api_key"]');
	}

	get inputResetBugsnagApiKey(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Bugsnag_api_key"]');
	}

	get inputRobotsFileContent(): Locator {
		return this.page.locator('#Robot_Instructions_File_Content');
	}

	get btnResetRobotsFileContent(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Robot_Instructions_File_Content"]');
	}

	get btnImportNewFile(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button >> text="Import New File"');
	}

	async getOptionFileType(option: string): Promise<Locator> {
		await this.page.locator('.rcx-select').click();
		return this.page.locator(`.rcx-option__content >> text="${option}"`);
	}

	get inputFile(): Locator {
		return this.page.locator('input[type=file]');
	}

	get btnImport(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button >> text="Import"');
	}

	get btnStartImport(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button >> text="Start Importing"');
	}

	get importStatusTableFirstRowCell(): Locator {
		return this.page.locator('[data-qa-id="ImportTable"] tbody tr:first-child td >> text="Completed successfully"');
	}

	get btnAssetsSettings(): Locator {
		return this.page.locator('[data-qa-id="Assets"] >> role=link[name="Open"]');
	}

	get btnDeleteAssetsLogo(): Locator {
		return this.page.locator('//label[@title="Assets_logo"]/following-sibling::span >> role=button[name="Delete"]');
	}

	get btnCreateRole(): Locator {
		return this.page.locator('button[name="New role"]');
	}

	get inputAssetsLogo(): Locator {
		return this.page.locator('//label[@title="Assets_logo"]/following-sibling::span >> input[type="file"]');
	}

	async dropdownFilterRoomType(text = 'All rooms'): Promise<Locator> {
		return this.page.locator(`div[role="button"]:has-text("${text}")`);
	}
}
