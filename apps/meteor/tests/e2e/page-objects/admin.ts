import type { Locator, Page } from '@playwright/test';

import { AdminFlextab } from './fragments/admin-flextab';

export enum AdminSectionsHref {
	Workspace = '/admin/info',
	Subscription = '/admin/subscription',
	Engagement = '/admin/engagement/users',
	Moderation = '/admin/moderation',
	Federation = '/admin/federation',
	Rooms = '/admin/rooms',
	Users = '/admin/users',
	Invites = '/admin/invites',
	User_Status = '/admin/user-status',
	Permissions = '/admin/permissions',
	Device_Management = '/admin/device-management',
	Email_Inboxes = '/admin/email-inboxes',
	Mailer = '/admin/mailer',
	Third_party_login = '/admin/third-party-login',
	Integrations = '/admin/integrations',
	Import = '/admin/import',
	Reports = '/admin/reports',
	Sounds = '/admin/sounds',
	Emoji = '/admin/emoji',
	Settings = '/admin/settings',
}
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

	getUserRow(username?: string): Locator {
		return this.page.locator('[role="link"]', { hasText: username });
	}

	get btnSave(): Locator {
		return this.page.locator('button >> text="Save"');
	}

	get btnSaveSettings(): Locator {
		return this.page.getByRole('button', { name: 'Save changes' });
	}

	get btnEdit(): Locator {
		return this.page.locator('button >> text="Edit"');
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

	get inputAssetsLogo(): Locator {
		return this.page.locator('//label[@title="Assets_logo"]/following-sibling::span >> input[type="file"]');
	}

	get btnCreateRole(): Locator {
		return this.page.locator('button[name="New role"]');
	}

	openRoleByName(name: string): Locator {
		return this.page.getByRole('table').getByRole('button', { name });
	}

	get btnUsersInRole(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Users in role', exact: true });
	}

	get inputRoom(): Locator {
		return this.page.locator('input[placeholder="Room"]');
	}

	get inputUsers(): Locator {
		return this.page.locator('input[placeholder="Users"]');
	}

	get btnAdd(): Locator {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	getUserRowByUsername(username: string): Locator {
		return this.page.locator('tr', { hasText: username });
	}

	get btnBack(): Locator {
		return this.page.getByRole('button', { name: 'Back', exact: true });
	}

	get btnNew(): Locator {
		return this.page.getByRole('button', { name: 'New', exact: true });
	}

	get btnNewApplication(): Locator {
		return this.page.getByRole('button', { name: 'New Application', exact: true });
	}

	get btnDelete(): Locator {
		return this.page.getByRole('button', { name: 'Delete', exact: true });
	}

	get btnInstructions(): Locator {
		return this.page.getByRole('button', { name: 'Instructions', exact: true });
	}

	get inputName(): Locator {
		return this.page.getByRole('textbox', { name: 'Name' });
	}

	get inputApplicationName(): Locator {
		return this.page.getByRole('textbox', { name: 'Application Name' });
	}

	get inputClientId(): Locator {
		return this.page.getByRole('textbox', { name: 'Client ID' });
	}

	get inputClientSecret(): Locator {
		return this.page.getByRole('textbox', { name: 'Client Secret' });
	}

	get inputAuthUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Authorization URL' });
	}

	get inputTokenUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Access Token URL' });
	}

	get inputPostToChannel(): Locator {
		return this.page.getByRole('textbox', { name: 'Post to Channel' });
	}

	get inputPostAs(): Locator {
		return this.page.getByRole('textbox', { name: 'Post as' });
	}

	get inputRedirectURI(): Locator {
		return this.page.getByRole('textbox', { name: 'Redirect URI' });
	}

	codeExamplePayload(text: string): Locator {
		return this.page.locator('code', { hasText: text });
	}

	getIntegrationByName(name: string): Locator {
		return this.page.getByRole('table', { name: 'Integrations table' }).locator('tr', { hasText: name });
	}

	getThirdPartyAppByName(name: string): Locator {
		return this.page.getByRole('table', { name: 'Third-party applications table' }).locator('tr', { hasText: name });
	}

	get inputWebhookUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Webhook URL' });
	}

	getAccordionBtnByName(name: string): Locator {
		return this.page.getByRole('button', { name, exact: true });
	}

	get btnFullScreen(): Locator {
		return this.page.getByRole('button', { name: 'Full Screen', exact: true });
	}

	get btnExitFullScreen(): Locator {
		return this.page.getByRole('button', { name: 'Exit Full Screen', exact: true });
	}

	async dropdownFilterRoomType(text = 'All rooms'): Promise<Locator> {
		return this.page.locator(`div[role="button"]:has-text("${text}")`);
	}

	async adminSectionButton(href: AdminSectionsHref): Promise<Locator> {
		return this.page.locator(`a[href="${href}"]`);
	}

	findFileRowByUsername(username: string) {
		return this.page.locator('tr', { has: this.page.getByRole('cell', { name: username }) });
	}

	findFileCheckboxByUsername(username: string) {
		return this.findFileRowByUsername(username).locator('label', { has: this.page.getByRole('checkbox') });
	}
}
