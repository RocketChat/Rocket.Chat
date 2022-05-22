import Page from './Page';

class Administration extends Page {
	get flexNav() {
		return browser.element('.flex-nav');
	}

	get flexNavContent() {
		return browser.element('.flex-nav');
	}

	get settingsSearch() {
		return browser.element('input[type=search]');
	}

	get settingsLink() {
		return browser.element('.flex-nav [href="/admin/settings"]');
	}

	get groupSettingsPageBack() {
		return browser.element('button[title="Back"]');
	}

	get layoutLink() {
		return browser.element('.flex-nav [href="/admin/Layout"]');
	}

	get infoLink() {
		return browser.element('.flex-nav [href="/admin/info"]');
	}

	get roomsLink() {
		return browser.element('.flex-nav [href="/admin/rooms"]');
	}

	get usersLink() {
		return browser.element('.flex-nav [href="/admin/users"]');
	}

	get accountsSettingsButton() {
		return browser.element('[data-qa-id="Accounts"] button:contains("Open")');
	}

	get generalSettingsButton() {
		return browser.element('[data-qa-id="General"] button:contains("Open")');
	}

	get permissionsLink() {
		return browser.element('.flex-nav [href="/admin/permissions"]');
	}

	get customScriptBtn() {
		return browser.element('.section:nth-of-type(6) .collapse');
	}

	get customScriptLoggedOutTextArea() {
		return browser.element('.section:nth-of-type(6) .CodeMirror-scroll');
	}

	get customScriptLoggedInTextArea() {
		return browser.element('.CodeMirror.cm-s-default:nth-of-type(2)');
	}

	get infoDeployment() {
		return browser.element('[data-qa-id="deployment-card"]');
	}

	get infoLicense() {
		return browser.element('[data-qa-id="license-card"]');
	}

	get infoUsage() {
		return browser.element('[data-qa-id="usage-card"]');
	}

	get infoFederation() {
		return browser.element('[data-qa-id="federation-card"]');
	}

	get roomsSearchForm() {
		return browser.element('.content .search');
	}

	get roomsFilter() {
		return browser.element('#rooms-filter');
	}

	get roomsChannelsCheckbox() {
		return browser.element('label:nth-of-type(1) input[name="room-type"]');
	}

	get roomsDirectCheckbox() {
		return browser.element('label:nth-of-type(2) input[name="room-type"]');
	}

	get roomsPrivateCheckbox() {
		return browser.element('label:nth-of-type(3) input[name="room-type"]');
	}

	get roomsGeneralChannel() {
		return browser.element('td=general');
	}

	get usersRocketCat() {
		return browser.element('td=Rocket.Cat');
	}

	get usersInternalAdmin() {
		return browser.element('.rcx-table__cell:contains("@rocketchat.internal.admin.test")');
	}

	get usersInRole() {
		return browser.element('button:contains("Users in role")');
	}

	get usersFilter() {
		return browser.element('input[placeholder="Search Users"]');
	}

	get rolesNewRolesButton() {
		return browser.element('button[aria-label="New"]');
	}

	get rolesPermissionGrid() {
		return browser.element('[role=tab]:contains("Permission")');
	}

	get rolesAdmin() {
		return browser.element('.rcx-table__cell--header:contains("Admin")');
	}

	get rolesModerator() {
		return browser.element('[title="Moderator"]');
	}

	get rolesOwner() {
		return browser.element('[title="Owner"]');
	}

	get rolesReturnLink() {
		return browser.element('[href="/admin/permissions"]');
	}

	get rolesNewRoleName() {
		return browser.element('input[placeholder="Role"]');
	}

	get rolesNewRoleDesc() {
		return browser.element('input[placeholder="Description"]');
	}

	get rolesNewRoleScope() {
		return browser.element('label:contains("Scope")');
	}

	get rolesAddBtn() {
		return browser.element('button.add');
	}

	get rolesRoomsSearchForm() {
		return browser.element('.search [name="room"]');
	}

	get rolesSettingsFindInput() {
		return browser.element('input#permissions-filter');
	}

	get rolesSettingsTab() {
		return browser.element('button[data-value="settings"]');
	}

	get rolesPermissionsTab() {
		return browser.element('button[data-value="permissions"]');
	}

	// permissions grids checkboxes

	get rolesUserCreateC() {
		return browser.element('[name="perm[user][create-c]"]');
	}

	get rolesUserCreateP() {
		return browser.element('[name="perm[user][create-p]"]');
	}

	get rolesUserCreateD() {
		return browser.element('[name="perm[user][create-d]"]');
	}

	get rolesUserMentionAll() {
		return browser.element('[name="perm[user][mention-all]"]');
	}

	get rolesUserPreviewC() {
		return browser.element('[name="perm[user][preview-c-room]"]');
	}

	get rolesUserViewC() {
		return browser.element('[name="perm[user][view-c-room]"]');
	}

	get rolesUserViewD() {
		return browser.element('[name="perm[user][view-d-room]"]');
	}

	get rolesUserViewP() {
		return browser.element('[name="perm[user][view-p-room]"]');
	}

	get rolesUserHistory() {
		return browser.element('[name="perm[user][view-history]"]');
	}

	get rolesOwnerDeleteMessage() {
		return browser.element('[name="perm[owner][delete-message]"]');
	}

	get rolesOwnerEditMessage() {
		return browser.element('[name="perm[owner][edit-message]"]');
	}

	get rolesManageSettingsPermissions() {
		return browser.element('[name="perm[user][manage-selected-settings]"]');
	}

	get rolesSettingLayoutTitle() {
		return browser.element('[name="perm[user][change-setting-Layout_Home_Title]"');
	}

	get emojiFilter() {
		return browser.element('#emoji-filter');
	}

	// settings
	get buttonSave() {
		return browser.element('button.save');
	}

	get generalSectionIframeIntegration() {
		return browser.element('[data-qa-section="Iframe_Integration"]');
	}

	get generalSectionNotifications() {
		return browser.element('[data-qa-section="Notifications"]');
	}

	get generalSectionRestApi() {
		return browser.element('[data-qa-section="REST API"]');
	}

	get generalSectionReporting() {
		return browser.element('[data-qa-section="Reporting"]');
	}

	get generalSectionStreamCast() {
		return browser.element('[data-qa-section="Stream_Cast"]');
	}

	get generalSectionUTF8() {
		return browser.element('[data-qa-section="UTF8"]');
	}

	get generalSiteUrl() {
		return browser.element('[data-qa-setting-id="Site_Url"]');
	}

	get generalSiteUrlReset() {
		return browser.element('[data-qa-reset-setting-id="Site_Url"]');
	}

	get generalSiteName() {
		return browser.element('[data-qa-setting-id="Site_Name"]');
	}

	get generalSiteNameReset() {
		return browser.element('[data-qa-reset-setting-id="Site_Name"]');
	}

	get generalLanguage() {
		return browser.element('[data-qa-setting-id="Language"]');
	}

	get generalLanguagePtOption() {
		return browser.element('[value="pt"]');
	}

	get generalLanguageReset() {
		return browser.element('[data-qa-reset-setting-id="Language"]');
	}

	get generalSelfSignedCerts() {
		return browser.element('[data-qa-setting-id="Allow_Invalid_SelfSigned_Certs"]');
	}

	get generalSelfSignedCertsReset() {
		return browser.element('[data-qa-reset-setting-id="Allow_Invalid_SelfSigned_Certs"]');
	}

	get generalFavoriteRoom() {
		return browser.element('[data-qa-setting-id="Favorite_Rooms"]');
	}

	get generalFavoriteRoomReset() {
		return browser.element('[data-qa-reset-setting-id="Favorite_Rooms"]');
	}

	get generalOpenFirstChannel() {
		return browser.element('[data-qa-setting-id="First_Channel_After_Login"]');
	}

	get generalOpenFirstChannelReset() {
		return browser.element('[data-qa-reset-setting-id="First_Channel_After_Login"]');
	}

	get generalCdnPrefix() {
		return browser.element('[data-qa-setting-id="CDN_PREFIX"]');
	}

	get generalCdnPrefixReset() {
		return browser.element('[data-qa-reset-setting-id="CDN_PREFIX"]');
	}

	get generalForceSSL() {
		return browser.element('[data-qa-setting-id="Force_SSL"]');
	}

	get generalForceSSLReset() {
		return browser.element('[data-qa-reset-setting-id="Force_SSL"]');
	}

	get generalGoogleTagId() {
		return browser.element('[data-qa-setting-id="GoogleTagManager_id"]');
	}

	get generalGoogleTagIdReset() {
		return browser.element('[data-qa-reset-setting-id="GoogleTagManager_id"]');
	}

	get generalBugsnagKey() {
		return browser.element('[data-qa-setting-id="Bugsnag_api_key"]');
	}

	get generalBugsnagKeyReset() {
		return browser.element('[data-qa-reset-setting-id="Bugsnag_api_key"]');
	}

	get generalIframeSend() {
		return browser.element('[data-qa-setting-id="Iframe_Integration_send_enable"]');
	}

	get generalIframeSendReset() {
		return browser.element('[data-qa-reset-setting-id="Iframe_Integration_send_enable"]');
	}

	get generalIframeSendTargetOrigin() {
		return browser.element('[data-qa-setting-id="Iframe_Integration_send_target_origin"]');
	}

	get generalIframeSendTargetOriginReset() {
		return browser.element('[data-qa-reset-setting-id="Iframe_Integration_send_target_origin"]');
	}

	get generalIframeRecieve() {
		return browser.element('[data-qa-setting-id="Iframe_Integration_receive_enable"]');
	}

	get generalIframeRecieveOrigin() {
		return browser.element('[data-qa-setting-id="Iframe_Integration_receive_origin"]');
	}

	get generalIframeRecieveOriginReset() {
		return browser.element('[data-qa-reset-setting-id="Iframe_Integration_receive_origin"]');
	}

	get generalNotificationsMaxRoomMembers() {
		return browser.element('[data-qa-setting-id="Notifications_Max_Room_Members"]');
	}

	get generalNotificationsMaxRoomMembersReset() {
		return browser.element('[data-qa-reset-setting-id="Notifications_Max_Room_Members"]');
	}

	get generalRestApiUserLimit() {
		return browser.element('[data-qa-setting-id="API_User_Limit"]');
	}

	get generalRestApiUserLimitReset() {
		return browser.element('[data-qa-reset-setting-id="API_User_Limit"]');
	}

	get generalReporting() {
		return browser.element('[data-qa-setting-id="Statistics_reporting"]');
	}

	get generalReportingReset() {
		return browser.element('[data-qa-reset-setting-id="Statistics_reporting"]');
	}

	get generalStreamCastAdress() {
		return browser.element('[data-qa-setting-id="Stream_Cast_Address"]');
	}

	get generalStreamCastAdressReset() {
		return browser.element('[data-qa-reset-setting-id="Stream_Cast_Address"]');
	}

	get generalUTF8UsernamesRegex() {
		return browser.element('[data-qa-setting-id="UTF8_User_Names_Validation"]');
	}

	get generalUTF8ChannelsRegex() {
		return browser.element('[data-qa-setting-id="UTF8_Channel_Names_Validation"]');
	}

	get generalUTF8RegexReset() {
		return browser.element('[data-qa-reset-setting-id="UTF8_User_Names_Validation"]');
	}

	get generalUTF8NamesSlug() {
		return browser.element('[data-qa-setting-id="UTF8_Names_Slugify"]');
	}

	get generalUTF8NamesSlugReset() {
		return browser.element('[data-qa-reset-setting-id="UTF8_Names_Slugify"]');
	}

	get generalLayoutTitle() {
		return browser.element('[data-qa-setting-id="Layout_Home_Title"]');
	}

	// accounts
	get accountsSectionDefaultUserPreferences() {
		return browser.element('[data-qa-section="Accounts_Default_User_Preferences"]');
	}

	get accountsEnableAutoAway() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_enableAutoAway"]');
	}

	get accountsEnableAutoAwayReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_enableAutoAway"]');
	}

	get accountsidleTimeLimit() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_idleTimeLimit"]');
	}

	get accountsidleTimeLimitReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_idleTimeLimit"]');
	}

	get accountsDesktopNotifications() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_desktopNotifications"]');
	}

	get accountsDesktopNotificationsReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_desktopNotifications"]');
	}

	get accountsMobileNotifications() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_pushNotifications"]');
	}

	get accountsMobileNotificationsReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_pushNotifications"]');
	}

	get accountsUnreadAlert() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_unreadAlert"]');
	}

	get accountsUnreadAlertReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_unreadAlert"]');
	}

	get accountsUseEmojis() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_useEmojis"]');
	}

	get accountsUseEmojisReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_useEmojis"]');
	}

	get accountsConvertAsciiEmoji() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_convertAsciiEmoji"]');
	}

	get accountsConvertAsciiEmojiReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_convertAsciiEmoji"]');
	}

	get accountsAutoImageLoad() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_autoImageLoad"]');
	}

	get accountsAutoImageLoadReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_autoImageLoad"]');
	}

	get accountsSaveMobileBandwidth() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_saveMobileBandwidth"]');
	}

	get accountsSaveMobileBandwidthReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_saveMobileBandwidth"]');
	}

	get accountsCollapseMediaByDefault() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_collapseMediaByDefault"]');
	}

	get accountsCollapseMediaByDefaultReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_collapseMediaByDefault"]');
	}

	get accountsHideUsernames() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_hideUsernames"]');
	}

	get accountsHideUsernamesReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_hideUsernames"]');
	}

	get accountsHideRoles() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_hideRoles"]');
	}

	get accountsHideRolesReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_hideRoles"]');
	}

	get accountsHideFlexTab() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_hideFlexTab"]');
	}

	get accountsHideFlexTabReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_hideFlexTab"]');
	}

	get DisplayAvatars() {
		return browser.element('[data-qa-setting-id="displayAvatars"]');
	}

	get DisplayAvatarsReset() {
		return browser.element('[data-qa-reset-setting-id="displayAvatars"]');
	}

	get accountsDisplayAvatars() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_displayAvatars"]');
	}

	get accountsMergeChannels() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_mergeChannels"]');
	}

	get accountsMergeChannelsReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_mergeChannels"]');
	}

	get accountsSendOnEnter() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_sendOnEnter"]');
	}

	get accountsSendOnEnterReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_sendOnEnter"]');
	}

	get accountsMessageViewMode() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_messageViewMode"]');
	}

	get accountsMessageViewModeReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_messageViewMode"]');
	}

	get accountsEmailNotificationMode() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_emailNotificationMode"]');
	}

	get accountsEmailNotificationModeReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_emailNotificationMode"]');
	}

	get accountsNewRoomNotification() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_newRoomNotification"]');
	}

	get accountsNewRoomNotificationReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_newRoomNotification"]');
	}

	get accountsNewMessageNotification() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_newMessageNotification"]');
	}

	get accountsNewMessageNotificationReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_newMessageNotification"]');
	}

	get accountsMuteFocusedConversations() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_muteFocusedConversations"]');
	}

	get accountsMuteFocusedConversationsReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_muteFocusedConversations"]');
	}

	get accountsNotificationsSoundVolume() {
		return browser.element('[data-qa-setting-id="Accounts_Default_User_Preferences_notificationsSoundVolume"]');
	}

	get accountsNotificationsSoundVolumeReset() {
		return browser.element('[data-qa-reset-setting-id="Accounts_Default_User_Preferences_notificationsSoundVolume"]');
	}

	get accountsRealNameChange() {
		return browser.element('[data-qa-setting-id="Accounts_AllowRealNameChange"]');
	}

	get accountsUserStatusMessageChange() {
		return browser.element('[data-qa-setting-id="Accounts_AllowUserStatusMessageChange"]');
	}

	get accountsUsernameChange() {
		return browser.element('[data-qa-setting-id="Accounts_AllowUsernameChange"]');
	}

	get layoutButtonExpandContent() {
		return browser.element('.section:nth-of-type(2) .rc-button.rc-button--nude');
	}

	checkUserList(user) {
		const element = browser.element(`td=adminCreated${user}`);
		element.waitForVisible(5000);
		browser.pause(500);
		const result = element.isVisible();
		if (Array.isArray(result)) {
			return result[0];
		}

		return result;
	}

	getUserFromList(user) {
		return browser.element(`.rcx-table__cell:first-child:contains(${user}) figure`).should('be.visible');
	}

	adminSaveChanges() {
		this.buttonSave.waitForVisible(5000);
		browser.waitUntil(function () {
			return browser.isEnabled('button.save');
		}, 5000);
		this.buttonSave.click();
	}
}

export default new Administration();
