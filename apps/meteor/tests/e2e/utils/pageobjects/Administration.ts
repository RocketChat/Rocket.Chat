import { Locator, expect } from '@playwright/test';

import BasePage from './BasePage';

export default class Administration extends BasePage {
	public settingsSearch(): Locator {
		return this.getPage().locator('input[type=search]');
	}

	public settingsLink(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/settings"]');
	}

	public groupSettingsPageBack(): Locator {
		return this.getPage().locator('button[title="Back"]');
	}

	public infoLink(): Locator {
		return this.getPage().locator('//div[contains(text(),"Info")]');
	}

	public roomsLink(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/rooms"]');
	}

	public usersLink(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/users"]');
	}

	public accountSettingsButton(): Locator {
		return this.getPage().locator('[data-qa-id="Accounts"] button');
	}

	public generalSettingsButton(): Locator {
		return this.getPage().locator('[data-qa-id="General"] button');
	}

	public layoutSettingsButton(): Locator {
		return this.getPage().locator('[data-qa-id="Layout"] button');
	}

	public permissionsLink(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/permissions"]');
	}

	public infoDeployment(): Locator {
		return this.getPage().locator('//div[text()="Deployment"]');
	}

	public infoLicense(): Locator {
		return this.getPage().locator('//div[text()="License"]');
	}

	public infoUsage(): Locator {
		return this.getPage().locator('//div[text()="Usage"]');
	}

	public infoFederation(): Locator {
		return this.getPage().locator('//section[@data-qa="admin-info"]//div[text()="Federation"]');
	}

	public roomsSearchForm(): Locator {
		return this.getPage().locator('input[placeholder ="Search Rooms"]');
	}

	public async verifyCheckBoxRendered(checkBoxes: string[]): Promise<void> {
		const expected = [];
		for (const checkBox of checkBoxes) {
			expected.push(expect(this.adminCheckBox(checkBox)).toBeVisible());
		}
		await Promise.all(expected);
	}

	public roomsGeneralChannel(): Locator {
		return this.getPage().locator('//table//tbody//tr[1]//..//div//div//div//div[text()="general"]');
	}

	public notFoundChannelOrUser(): Locator {
		return this.getPage().locator("//div[text()='No data found']");
	}

	public notFoundChannels(): Locator {
		return this.getPage().locator("//div[text()='No results found']");
	}

	public usersFilter(): Locator {
		return this.getPage().locator('input[placeholder="Search Users"]');
	}

	public userInTable(id: string): Locator {
		return this.getPage().locator(`tr > td:has-text("${id}")`);
	}

	public rolesSettingsFindInput(): Locator {
		return this.getPage().locator('[data-qa="PermissionTable-PermissionsTableFilter"]');
	}

	public rolesSettingsTab(): Locator {
		return this.getPage().locator('[data-qa="PermissionTable-Settings"]');
	}

	public homeTitleInput(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Layout_Home_Title"]');
	}

	public buttonSave(): Locator {
		return this.getPage().locator('button.save');
	}

	public generalSectionIframeIntegration(): Locator {
		return this.getPage().locator('[data-qa-section="Iframe_Integration"]');
	}

	public generalIframeSendTargetOrigin(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_send_target_origin"]');
	}

	public generalSectionNotifications(): Locator {
		return this.getPage().locator('[data-qa-section="Notifications"]');
	}

	public generalSectionRestApi(): Locator {
		return this.getPage().locator('[data-qa-section="REST API"]');
	}

	public generalSectionReporting(): Locator {
		return this.getPage().locator('[data-qa-section="Reporting"]');
	}

	public generalSectionStreamCast(): Locator {
		return this.getPage().locator('[data-qa-section="Stream_Cast"]');
	}

	public generalSectionUTF8(): Locator {
		return this.getPage().locator('[data-qa-section="UTF8"]');
	}

	public generalSiteUrl(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Site_Url"]');
	}

	public generalSiteUrlReset(): Locator {
		return this.getPage().locator('//label[@title="Site_Url"]//following-sibling::button');
	}

	public generalSiteName(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Site_Name"]');
	}

	public generalSiteNameReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Site_Name"]');
	}

	public generalHomeTitleReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Layout_Home_Title"]');
	}

	public generalLanguage(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Language"]');
	}

	public generalSelfSignedCerts(): Locator {
		return this.getPage().locator('//label[@data-qa-setting-id="Allow_Invalid_SelfSigned_Certs"]//i');
	}

	public generalSelfSignedCertsReset(): Locator {
		return this.getPage().locator('//button[@data-qa-reset-setting-id="Allow_Invalid_SelfSigned_Certs"]');
	}

	public generalFavoriteRoom(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Favorite_Rooms"]');
	}

	public generalFavoriteRoomReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Favorite_Rooms"]');
	}

	public generalCdnPrefix(): Locator {
		return this.getPage().locator('[data-qa-setting-id="CDN_PREFIX"]');
	}

	public generalCdnPrefixReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="CDN_PREFIX"]');
	}

	public generalForceSSL(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Force_SSL"]');
	}

	public generalForceSSLReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Force_SSL"]');
	}

	public generalGoogleTagId(): Locator {
		return this.getPage().locator('[data-qa-setting-id="GoogleTagManager_id"]');
	}

	public generalGoogleTagIdReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="GoogleTagManager_id"]');
	}

	public generalBugsnagKey(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Bugsnag_api_key"]');
	}

	public generalBugsnagKeyReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Bugsnag_api_key"]');
	}

	public robotsFileContents(): Locator {
		return this.getPage().locator('#Robot_Instructions_File_Content');
	}

	public robotsFileContentsReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Robot_Instructions_File_Content"]');
	}

	public defaultReferrerPolicy(): Locator {
		return this.getPage().locator('//div[@data-qa-setting-id="Default_Referrer_Policy"]');
	}

	public defaultReferrerPolicyReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Default_Referrer_Policy"]');
	}

	public defaultReferrerPolicyOptions(): Locator {
		return this.getPage().locator('.rcx-options .rcx-option:first-child');
	}

	public generalIframeSend(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_send_enable"]');
	}

	public generalIframeReceive(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_receive_enable"]');
	}

	public generalIframeReceiveOrigin(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_receive_origin"]');
	}

	public generalNotificationsMaxRoomMembers(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Notifications_Max_Room_Members"]');
	}

	public generalRestApiUserLimit(): Locator {
		return this.getPage().locator('[data-qa-setting-id="API_User_Limit"]');
	}

	public generalReporting(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Statistics_reporting"]');
	}

	public generalStreamCastAddress(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Stream_Cast_Address"]');
	}

	public generalUTF8UsernamesRegex(): Locator {
		return this.getPage().locator('[data-qa-setting-id="UTF8_User_Names_Validation"]');
	}

	public generalUTF8ChannelsRegex(): Locator {
		return this.getPage().locator('[data-qa-setting-id="UTF8_Channel_Names_Validation"]');
	}

	public generalUTF8NamesSlug(): Locator {
		return this.getPage().locator('[data-qa-setting-id="UTF8_Names_Slugify"]');
	}

	public accountsSectionDefaultUserPreferences(): Locator {
		return this.getPage().locator('[data-qa-section="Accounts_Default_User_Preferences"]');
	}

	public accountsEnableAutoAway(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_enableAutoAway"]');
	}

	public accountsIdleTimeLimit(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_idleTimeLimit"]');
	}

	public accountsDesktopNotifications(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_desktopNotifications"]');
	}

	public accountsMobileNotifications(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_pushNotifications"]');
	}

	public accountsUnreadAlert(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_unreadAlert"]');
	}

	public accountsConvertAsciiEmoji(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_convertAsciiEmoji"]');
	}

	public accountsAutoImageLoad(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_autoImageLoad"]');
	}

	public accountsSaveMobileBandwidth(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_saveMobileBandwidth"]');
	}

	public accountsCollapseMediaByDefault(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_collapseMediaByDefault"]');
	}

	public accountsHideUsernames(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideUsernames"]');
	}

	public accountsHideRoles(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideRoles"]');
	}

	public accountsHideFlexTab(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideFlexTab"]');
	}

	public accountsDisplayAvatars(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_displayAvatars"]');
	}

	public accountsSendOnEnter(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_sendOnEnter"]');
	}

	public accountsMessageViewMode(): Locator {
		return this.getPage().locator('//div[@data-qa-setting-id="Accounts_Default_User_Preferences_messageViewMode"]//div//span');
	}

	public accountsEmailNotificationMode(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_emailNotificationMode"]');
	}

	public accountsNewRoomNotification(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_newRoomNotification"]');
	}

	public accountsNewMessageNotification(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_newMessageNotification"]');
	}

	public accountsNotificationsSoundVolume(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_notificationsSoundVolume"]');
	}

	public adminCheckBox(checkBox: string): Locator {
		return this.getPage().locator(`//label[text()="${checkBox}"]/preceding-sibling::label/i`);
	}

	public inputPermissionsSearch(): Locator {
		return this.getPage().locator('.main-content input[placeholder="Search"]');
	}

	public getCheckboxPermission(label: string, column = 6): Locator {
		return this.getPage().locator(`tr td:has-text("${label}") ~ td:nth-child(${column})`).locator('label').first();
	}

	public userInfoActions(): Locator {
		return this.getPage().locator('[data-qa-id="UserInfoActions"]');
	}
}
