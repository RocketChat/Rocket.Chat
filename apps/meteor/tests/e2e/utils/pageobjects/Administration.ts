import { Locator, expect } from '@playwright/test';

import BasePage from './BasePage';

export default class Administration extends BasePage {
	public flexNav(): Locator {
		return this.getPage().locator('.flex-nav');
	}

	public flexNavContent(): Locator {
		return this.getPage().locator('.flex-nav');
	}

	public settingsSearch(): Locator {
		return this.getPage().locator('input[type=search]');
	}

	public settingsLink(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/settings"]');
	}

	public groupSettingsPageBack(): Locator {
		return this.getPage().locator('button[title="Back"]');
	}

	public layoutLink(): Locator {
		return this.getPage().locator('.flex-nav [href="/admin/Layout"]');
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

	public customScriptBtn(): Locator {
		return this.getPage().locator('.section:nth-of-type(6) .collapse');
	}

	public customScriptLoggedOutTextArea(): Locator {
		return this.getPage().locator('.section:nth-of-type(6) .CodeMirror-scroll');
	}

	public customScriptLoggedInTextArea(): Locator {
		return this.getPage().locator('.CodeMirror.cm-s-default:nth-of-type(2)');
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

	public roomsChannelsCheckbox(): Locator {
		return this.getPage().locator('label:nth-of-type(1) input[name="room-type"]');
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

	public usersRocketCat(): Locator {
		return this.getPage().locator('td=Rocket.Cat');
	}

	public usersInternalAdmin(): Locator {
		return this.getPage().locator('.rcx-table__cell:contains("@rocketchat.internal.admin.test")');
	}

	public usersInRole(): Locator {
		return this.getPage().locator('button:contains("Users in role")');
	}

	public usersFilter(): Locator {
		return this.getPage().locator('input[placeholder="Search Users"]');
	}

	public userInTable(id: string): Locator {
		return this.getPage().locator(`tr > td:has-text("${id}")`);
	}

	public rolesNewRolesButton(): Locator {
		return this.getPage().locator('button[aria-label="New"]');
	}

	public rolesPermissionGrid(): Locator {
		return this.getPage().locator('[role=tab]:contains("Permission")');
	}

	public rolesAdmin(): Locator {
		return this.getPage().locator('.rcx-table__cell--header:contains("Admin")');
	}

	public rolesModerator(): Locator {
		return this.getPage().locator('[title="Moderator"]');
	}

	public rolesOwner(): Locator {
		return this.getPage().locator('[title="Owner"]');
	}

	public rolesReturnLink(): Locator {
		return this.getPage().locator('[href="/admin/permissions"]');
	}

	public rolesNewRoleName(): Locator {
		return this.getPage().locator('input[placeholder="Role"]');
	}

	public rolesNewRoleDesc(): Locator {
		return this.getPage().locator('input[placeholder="Description"]');
	}

	public rolesNewRoleScope(): Locator {
		return this.getPage().locator('label:contains("Scope")');
	}

	public rolesAddBtn(): Locator {
		return this.getPage().locator('button.add');
	}

	public rolesRoomsSearchForm(): Locator {
		return this.getPage().locator('.search [name="room"]');
	}

	public rolesSettingsFindInput(): Locator {
		return this.getPage().locator('[data-qa="PermissionTable-PermissionsTableFilter"]');
	}

	public rolesSettingsTab(): Locator {
		return this.getPage().locator('[data-qa="PermissionTable-Settings"]');
	}

	public rolesPermissionsTab(): Locator {
		return this.getPage().locator('[data-qa="PermissionTable-Permissions"]');
	}

	public homeTitleInput(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Layout_Home_Title"]');
	}

	// permissions grids checkboxes

	public rolesUserCreateC(): Locator {
		return this.getPage().locator('[name="perm[user][create-c]"]');
	}

	public rolesUserCreateP(): Locator {
		return this.getPage().locator('[name="perm[user][create-p]"]');
	}

	public rolesUserCreateD(): Locator {
		return this.getPage().locator('[name="perm[user][create-d]"]');
	}

	public rolesUserMentionAll(): Locator {
		return this.getPage().locator('[name="perm[user][mention-all]"]');
	}

	public rolesUserPreviewC(): Locator {
		return this.getPage().locator('[name="perm[user][preview-c-room]"]');
	}

	public rolesUserViewC(): Locator {
		return this.getPage().locator('[name="perm[user][view-c-room]"]');
	}

	public rolesUserViewD(): Locator {
		return this.getPage().locator('[name="perm[user][view-d-room]"]');
	}

	public rolesUserViewP(): Locator {
		return this.getPage().locator('[name="perm[user][view-p-room]"]');
	}

	public rolesUserHistory(): Locator {
		return this.getPage().locator('[name="perm[user][view-history]"]');
	}

	public rolesOwnerDeleteMessage(): Locator {
		return this.getPage().locator('[name="perm[owner][delete-message]"]');
	}

	public rolesOwnerEditMessage(): Locator {
		return this.getPage().locator('[name="perm[owner][edit-message]"]');
	}

	public rolesManageSettingsPermissions(): Locator {
		return this.getPage().locator('[name="perm[user][manage-selected-settings]"]');
	}

	public rolesSettingLayoutTitle(): Locator {
		return this.getPage().locator('[name="perm[user][change-setting-Layout_Home_Title]"');
	}

	public emojiFilter(): Locator {
		return this.getPage().locator('#emoji-filter');
	}

	// settings
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

	public generalLanguagePtOption(): Locator {
		return this.getPage().locator('[value="pt"]');
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

	public generalOpenFirstChannel(): Locator {
		return this.getPage().locator('[data-qa-setting-id="First_Channel_After_Login"]');
	}

	public generalOpenFirstChannelReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="First_Channel_After_Login"]');
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

	public displayLastMessage(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Store_Last_Message"]');
	}

	public displayLastMessageReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Store_Last_Message"]');
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

	public generalIframeSendReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Iframe_Integration_send_enable"]');
	}

	public generalIframeSendTarpublicOrigin(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_send_tarpublic_origin"]');
	}

	public generalIframeSendTarpublicOriginReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Iframe_Integration_send_tarpublic_origin"]');
	}

	public generalIframeReceive(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_receive_enable"]');
	}

	public generalIframeReceiveOrigin(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Iframe_Integration_receive_origin"]');
	}

	public generalIframeReceiveOriginReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Iframe_Integration_receive_origin"]');
	}

	public generalNotificationsMaxRoomMembers(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Notifications_Max_Room_Members"]');
	}

	public generalNotificationsMaxRoomMembersReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Notifications_Max_Room_Members"]');
	}

	public generalRestApiUserLimit(): Locator {
		return this.getPage().locator('[data-qa-setting-id="API_User_Limit"]');
	}

	public generalRestApiUserLimitReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="API_User_Limit"]');
	}

	public generalReporting(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Statistics_reporting"]');
	}

	public generalReportingReset(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Statistics_reporting"]');
	}

	public generalStreamCastAddress(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Stream_Cast_Address"]');
	}

	public generalStreamCastAddressReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Stream_Cast_Address"]');
	}

	public generalUTF8UsernamesRegex(): Locator {
		return this.getPage().locator('[data-qa-setting-id="UTF8_User_Names_Validation"]');
	}

	public generalUTF8ChannelsRegex(): Locator {
		return this.getPage().locator('[data-qa-setting-id="UTF8_Channel_Names_Validation"]');
	}

	public generalUTF8RegexReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="UTF8_User_Names_Validation"]');
	}

	public generalUTF8NamesSlug(): Locator {
		return this.getPage().locator('[data-qa-setting-id="UTF8_Names_Slugify"]');
	}

	public generalUTF8NamesSlugReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="UTF8_Names_Slugify"]');
	}

	public generalLayoutTitle(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Layout_Home_Title"]');
	}

	// accounts
	public accountsSectionDefaultUserPreferences(): Locator {
		return this.getPage().locator('[data-qa-section="Accounts_Default_User_Preferences"]');
	}

	public accountsEnableAutoAway(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_enableAutoAway"]');
	}

	public accountsEnableAutoAwayReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_enableAutoAway"]');
	}

	public accountsIdleTimeLimit(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_idleTimeLimit"]');
	}

	public accountsIdleTimeLimitReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_idleTimeLimit"]');
	}

	public accountsDesktopNotifications(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_desktopNotifications"]');
	}

	public accountsDesktopNotificationsReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_desktopNotifications"]');
	}

	public accountsMobileNotifications(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_pushNotifications"]');
	}

	public accountsMobileNotificationsReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_pushNotifications"]');
	}

	public accountsUnreadAlert(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_unreadAlert"]');
	}

	public accountsUnreadAlertReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_unreadAlert"]');
	}

	public accountsUseEmojis(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_useEmojis"]');
	}

	public accountsUseEmojisReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_useEmojis"]');
	}

	public accountsConvertAsciiEmoji(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_convertAsciiEmoji"]');
	}

	public accountsConvertAsciiEmojiReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_convertAsciiEmoji"]');
	}

	public accountsAutoImageLoad(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_autoImageLoad"]');
	}

	public accountsAutoImageLoadReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_autoImageLoad"]');
	}

	public accountsSaveMobileBandwidth(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_saveMobileBandwidth"]');
	}

	public accountsSaveMobileBandwidthReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_saveMobileBandwidth"]');
	}

	public accountsCollapseMediaByDefault(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_collapseMediaByDefault"]');
	}

	public accountsCollapseMediaByDefaultReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_collapseMediaByDefault"]');
	}

	public accountsHideUsernames(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideUsernames"]');
	}

	public accountsHideUsernamesReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_hideUsernames"]');
	}

	public accountsHideRoles(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideRoles"]');
	}

	public accountsHideRolesReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_hideRoles"]');
	}

	public accountsHideFlexTab(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_hideFlexTab"]');
	}

	public accountsHideFlexTabReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_hideFlexTab"]');
	}

	public DisplayAvatars(): Locator {
		return this.getPage().locator('[data-qa-setting-id="displayAvatars"]');
	}

	public DisplayAvatarsReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="displayAvatars"]');
	}

	public accountsDisplayAvatars(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_displayAvatars"]');
	}

	public accountsMergeChannels(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_mergeChannels"]');
	}

	public accountsMergeChannelsReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_mergeChannels"]');
	}

	public accountsSendOnEnter(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_sendOnEnter"]');
	}

	public accountsSendOnEnterReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_sendOnEnter"]');
	}

	public accountsMessageViewMode(): Locator {
		return this.getPage().locator('//div[@data-qa-setting-id="Accounts_Default_User_Preferences_messageViewMode"]//div//span');
	}

	public accountsMessageViewModeReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_messageViewMode"]');
	}

	public accountsEmailNotificationMode(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_emailNotificationMode"]');
	}

	public accountsEmailNotificationModeReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_emailNotificationMode"]');
	}

	public accountsNewRoomNotification(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_newRoomNotification"]');
	}

	public accountsNewRoomNotificationReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_newRoomNotification"]');
	}

	public accountsNewMessageNotification(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_newMessageNotification"]');
	}

	public accountsNewMessageNotificationReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_newMessageNotification"]');
	}

	public accountsMuteFocusedConversations(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_muteFocusedConversations"]');
	}

	public accountsMuteFocusedConversationsReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_muteFocusedConversations"]');
	}

	public accountsNotificationsSoundVolume(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_Default_User_Preferences_notificationsSoundVolume"]');
	}

	public accountsNotificationsSoundVolumeReset(): Locator {
		return this.getPage().locator('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_notificationsSoundVolume"]');
	}

	public accountsRealNameChange(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_AllowRealNameChange"]');
	}

	public accountsUserStatusMessageChange(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_AllowUserStatusMessageChange"]');
	}

	public accountsUsernameChange(): Locator {
		return this.getPage().locator('[data-qa-setting-id="Accounts_AllowUsernameChange"]');
	}

	public layoutButtonExpandContent(): Locator {
		return this.getPage().locator('.section:nth-of-type(2) .rc-button.rc-button--nude');
	}

	public toastSuccess(): Locator {
		return this.getPage().locator('.toast-success');
	}

	public modalCancel(): Locator {
		return this.getPage().locator('//button[text()="Cancel"]');
	}

	public async publicUserFromList(user: string): Promise<void> {
		await expect(this.getPage().locator(`.rcx-table__cell:first-child:contains(${user}) figure`)).toBeVisible();
	}

	public adminCheckBox(checkBox: string): Locator {
		return this.getPage().locator(`//label[text()="${checkBox}"]/preceding-sibling::label/i`);
	}

	public async adminSaveChanges(): Promise<void> {
		await this.buttonSave().click();
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
