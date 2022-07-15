import { Locator, expect, Page } from '@playwright/test';

import { AdminFlextab, AdminSidenav } from './fragments';

export class Administration {
	private readonly page: Page;

	tabs: AdminFlextab;

	sidenav: AdminSidenav;

	constructor(page: Page) {
		this.page = page;
		this.tabs = new AdminFlextab(page);
		this.sidenav = new AdminSidenav(page);
	}

	get settingsSearch(): Locator {
		return this.page.locator('input[type=search]');
	}

	get settingsLink(): Locator {
		return this.page.locator('.flex-nav [href="/admin/settings"]');
	}

	get groupSettingsPageBack(): Locator {
		return this.page.locator('button[title="Back"]');
	}

	get infoLink(): Locator {
		return this.page.locator('//div[contains(text(),"Info")]');
	}

	get roomsLink(): Locator {
		return this.page.locator('.flex-nav [href="/admin/rooms"]');
	}

	get usersLink(): Locator {
		return this.page.locator('.flex-nav [href="/admin/users"]');
	}

	get accountSettingsButton(): Locator {
		return this.page.locator('[data-qa-id="Accounts"] button');
	}

	get generalSettingsButton(): Locator {
		return this.page.locator('[data-qa-id="General"] button');
	}

	get layoutSettingsButton(): Locator {
		return this.page.locator('[data-qa-id="Layout"] button');
	}

	get permissionsLink(): Locator {
		return this.page.locator('.flex-nav [href="/admin/permissions"]');
	}

	get infoDeployment(): Locator {
		return this.page.locator('//div[text()="Deployment"]');
	}

	get infoLicense(): Locator {
		return this.page.locator('//div[text()="License"]');
	}

	get infoUsage(): Locator {
		return this.page.locator('//div[text()="Usage"]');
	}

	get infoFederation(): Locator {
		return this.page.locator('//section[@data-qa="admin-info"]//div[text()="Federation"]');
	}

	get roomsSearchForm(): Locator {
		return this.page.locator('input[placeholder ="Search Rooms"]');
	}

	async verifyCheckBoxRendered(checkBoxes: string[]): Promise<void> {
		const expected = [];
		for (const checkBox of checkBoxes) {
			expected.push(expect(this.adminCheckBox(checkBox)).toBeVisible());
		}
		await Promise.all(expected);
	}

	get roomsGeneralChannel(): Locator {
		return this.page.locator('//table//tbody//tr[1]//..//div//div//div//div[text()="general"]');
	}

	get notFoundChannelOrUser(): Locator {
		return this.page.locator("//div[text()='No data found']");
	}

	get notFoundChannels(): Locator {
		return this.page.locator("//div[text()='No results found']");
	}

	get usersFilter(): Locator {
		return this.page.locator('input[placeholder="Search Users"]');
	}

	userInTable(id: string): Locator {
		return this.page.locator(`tr > td:has-text("${id}")`);
	}

	get rolesSettingsFindInput(): Locator {
		return this.page.locator('[data-qa="PermissionTable-PermissionsTableFilter"]');
	}

	get rolesSettingsTab(): Locator {
		return this.page.locator('[data-qa="PermissionTable-Settings"]');
	}

	get homeTitleInput(): Locator {
		return this.page.locator('[data-qa-setting-id="Layout_Home_Title"]');
	}

	get buttonSave(): Locator {
		return this.page.locator('button.save');
	}

	get generalSectionIframeIntegration(): Locator {
		return this.page.locator('[data-qa-section="Iframe_Integration"]');
	}

	get generalIframeSendTargetOrigin(): Locator {
		return this.page.locator('[data-qa-setting-id="Iframe_Integration_send_target_origin"]');
	}

	get generalSectionNotifications(): Locator {
		return this.page.locator('[data-qa-section="Notifications"]');
	}

	get generalSectionRestApi(): Locator {
		return this.page.locator('[data-qa-section="REST API"]');
	}

	get generalSectionReporting(): Locator {
		return this.page.locator('[data-qa-section="Reporting"]');
	}

	get generalSectionStreamCast(): Locator {
		return this.page.locator('[data-qa-section="Stream_Cast"]');
	}

	get generalSectionUTF8(): Locator {
		return this.page.locator('[data-qa-section="UTF8"]');
	}

	get generalSiteUrl(): Locator {
		return this.page.locator('[data-qa-setting-id="Site_Url"]');
	}

	get generalSiteUrlReset(): Locator {
		return this.page.locator('//label[@title="Site_Url"]//following-sibling::button');
	}

	get generalSiteName(): Locator {
		return this.page.locator('[data-qa-setting-id="Site_Name"]');
	}

	get generalSiteNameReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Site_Name"]');
	}

	get generalHomeTitleReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Layout_Home_Title"]');
	}

	get generalLanguage(): Locator {
		return this.page.locator('[data-qa-setting-id="Language"]');
	}

	get generalSelfSignedCerts(): Locator {
		return this.page.locator('//label[@data-qa-setting-id="Allow_Invalid_SelfSigned_Certs"]//i');
	}

	get generalSelfSignedCertsReset(): Locator {
		return this.page.locator('//button[@data-qa-reset-setting-id="Allow_Invalid_SelfSigned_Certs"]');
	}

	get generalFavoriteRoom(): Locator {
		return this.page.locator('[data-qa-setting-id="Favorite_Rooms"]');
	}

	get generalFavoriteRoomReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Favorite_Rooms"]');
	}

	get generalCdnPrefix(): Locator {
		return this.page.locator('[data-qa-setting-id="CDN_PREFIX"]');
	}

	get generalCdnPrefixReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="CDN_PREFIX"]');
	}

	get generalForceSSL(): Locator {
		return this.page.locator('[data-qa-setting-id="Force_SSL"]');
	}

	get generalForceSSLReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Force_SSL"]');
	}

	get generalGoogleTagId(): Locator {
		return this.page.locator('[data-qa-setting-id="GoogleTagManager_id"]');
	}

	get generalGoogleTagIdReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="GoogleTagManager_id"]');
	}

	get generalBugsnagKey(): Locator {
		return this.page.locator('[data-qa-setting-id="Bugsnag_api_key"]');
	}

	get generalBugsnagKeyReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Bugsnag_api_key"]');
	}

	get robotsFileContents(): Locator {
		return this.page.locator('#Robot_Instructions_File_Content');
	}

	get robotsFileContentsReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Robot_Instructions_File_Content"]');
	}

	get defaultReferrerPolicy(): Locator {
		return this.page.locator('//div[@data-qa-setting-id="Default_Referrer_Policy"]');
	}

	get defaultReferrerPolicyReset(): Locator {
		return this.page.locator('[data-qa-reset-setting-id="Default_Referrer_Policy"]');
	}

	get defaultReferrerPolicyOptions(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	get generalIframeSend(): Locator {
		return this.page.locator('[data-qa-setting-id="Iframe_Integration_send_enable"]');
	}

	get generalIframeReceive(): Locator {
		return this.page.locator('[data-qa-setting-id="Iframe_Integration_receive_enable"]');
	}

	get generalIframeReceiveOrigin(): Locator {
		return this.page.locator('[data-qa-setting-id="Iframe_Integration_receive_origin"]');
	}

	get generalNotificationsMaxRoomMembers(): Locator {
		return this.page.locator('[data-qa-setting-id="Notifications_Max_Room_Members"]');
	}

	get generalRestApiUserLimit(): Locator {
		return this.page.locator('[data-qa-setting-id="API_User_Limit"]');
	}

	get generalReporting(): Locator {
		return this.page.locator('[data-qa-setting-id="Statistics_reporting"]');
	}

	get generalStreamCastAddress(): Locator {
		return this.page.locator('[data-qa-setting-id="Stream_Cast_Address"]');
	}

	get generalUTF8UsernamesRegex(): Locator {
		return this.page.locator('[data-qa-setting-id="UTF8_User_Names_Validation"]');
	}

	get generalUTF8ChannelsRegex(): Locator {
		return this.page.locator('[data-qa-setting-id="UTF8_Channel_Names_Validation"]');
	}

	get generalUTF8NamesSlug(): Locator {
		return this.page.locator('[data-qa-setting-id="UTF8_Names_Slugify"]');
	}

	get accountsSectionDefaultUserPreferences(): Locator {
		return this.page.locator('[data-qa-section="Accounts_Default_User_Preferences"]');
	}

	get accountsEnableAutoAway(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_enableAutoAway"]');
	}

	get accountsIdleTimeLimit(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_idleTimeLimit"]');
	}

	get accountsDesktopNotifications(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_desktopNotifications"]');
	}

	get accountsMobileNotifications(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_pushNotifications"]');
	}

	get accountsUnreadAlert(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_unreadAlert"]');
	}

	get accountsConvertAsciiEmoji(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_convertAsciiEmoji"]');
	}

	get accountsAutoImageLoad(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_autoImageLoad"]');
	}

	get accountsSaveMobileBandwidth(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_saveMobileBandwidth"]');
	}

	get accountsCollapseMediaByDefault(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_collapseMediaByDefault"]');
	}

	get accountsHideUsernames(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideUsernames"]');
	}

	get accountsHideRoles(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideRoles"]');
	}

	get accountsHideFlexTab(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideFlexTab"]');
	}

	get accountsDisplayAvatars(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_displayAvatars"]');
	}

	get accountsSendOnEnter(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_sendOnEnter"]');
	}

	get accountsMessageViewMode(): Locator {
		return this.page.locator('//div[@data-qa-setting-id="Accounts_Default_User_Preferences_messageViewMode"]//div//span');
	}

	get accountsEmailNotificationMode(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_emailNotificationMode"]');
	}

	get accountsNewRoomNotification(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_newRoomNotification"]');
	}

	get accountsNewMessageNotification(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_newMessageNotification"]');
	}

	get accountsNotificationsSoundVolume(): Locator {
		return this.page.locator('[data-qa-setting-id="Accounts_Default_User_Preferences_notificationsSoundVolume"]');
	}

	adminCheckBox(checkBox: string): Locator {
		return this.page.locator(`//label[text()="${checkBox}"]/preceding-sibling::label/i`);
	}

	get inputPermissionsSearch(): Locator {
		return this.page.locator('.main-content input[placeholder="Search"]');
	}

	getCheckboxPermission(label: string, column = 6): Locator {
		return this.page.locator(`tr td:has-text("${label}") ~ td:nth-child(${column})`).locator('label').first();
	}

	get userInfoActions(): Locator {
		return this.page.locator('[data-qa-id="UserInfoActions"]');
	}
}
