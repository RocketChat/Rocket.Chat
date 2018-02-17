import Page from './Page';

class Administration extends Page {
	get flexNav() { return browser.element('.flex-nav'); }
	get flexNavContent() { return browser.element('.flex-nav'); }
	get settingsSearch() { return browser.element('[name=settings-search]'); }
	get layoutLink() { return browser.element('.flex-nav [href="/admin/Layout"]'); }
	get infoLink() { return browser.element('.flex-nav [href="/admin/info"]'); }
	get roomsLink() { return browser.element('.flex-nav [href="/admin/rooms"]'); }
	get usersLink() { return browser.element('.flex-nav [href="/admin/users"]'); }
	get accountsLink() { return browser.element('.flex-nav [href="/admin/Accounts"]'); }
	get generalLink() { return browser.element('.flex-nav [href="/admin/General"]'); }
	get permissionsLink() { return browser.element('.flex-nav [href="/admin/permissions"]'); }
	get customScriptBtn() { return browser.element('.section:nth-of-type(6) .collapse'); }
	get customScriptLoggedOutTextArea() { return browser.element('.section:nth-of-type(6) .CodeMirror-scroll'); }
	get customScriptLoggedInTextArea() { return browser.element('.CodeMirror.cm-s-default:nth-of-type(2)'); }
	get infoRocketChatTableTitle() { return browser.element('.content h3'); }
	get infoRocketChatTable() { return browser.element('.content .statistics-table'); }
	get infoCommitTableTitle() { return browser.element('.content h3:nth-of-type(2)'); }
	get infoCommitTable() { return browser.element('.content .statistics-table:nth-of-type(2)'); }
	get infoRuntimeTableTitle() { return browser.element('.content h3:nth-of-type(3)'); }
	get infoRuntimeTable() { return browser.element('.content .statistics-table:nth-of-type(3)'); }
	get infoBuildTableTitle() { return browser.element('.content h3:nth-of-type(4)'); }
	get infoBuildTable() { return browser.element('.content .statistics-table:nth-of-type(4)'); }
	get infoUsageTableTitle() { return browser.element('.content h3:nth-of-type(5)'); }
	get infoUsageTable() { return browser.element('.content .statistics-table:nth-of-type(5)'); }
	get roomsSearchForm() { return browser.element('.content .search'); }
	get roomsFilter() { return browser.element('#rooms-filter'); }
	get roomsChannelsCheckbox() { return browser.element('label:nth-of-type(1) input[name="room-type"]'); }
	get roomsDirectCheckbox() { return browser.element('label:nth-of-type(2) input[name="room-type"]'); }
	get roomsPrivateCheckbox() { return browser.element('label:nth-of-type(3) input[name="room-type"]'); }
	get roomsGeneralChannel() { return browser.element('td=general'); }
	get usersRocketCat() { return browser.element('td=Rocket.Cat'); }
	get usersInternalAdmin() { return browser.element('td=rocketchat.internal.admin.test'); }
	get usersFilter() { return browser.element('#users-filter'); }
	get rolesNewRolesButton() { return browser.element('.button.new-role'); }
	get rolesPermissionGrid() { return browser.element('.permission-grid'); }
	get rolesAdmin() { return browser.element('[title="Admin"]'); }
	get rolesModerator() { return browser.element('[title="Moderator"]'); }
	get rolesOwner() { return browser.element('[title="Owner"]'); }
	get rolesReturnLink() { return browser.element('[href="/admin/permissions"]'); }
	get rolesNewRoleName() { return browser.element('[name="name"]'); }
	get rolesNewRoleDesc() { return browser.element('[name="description"]'); }
	get rolesNewRoleScope() { return browser.element('[name="scope"]'); }
	get rolesAddBtn() { return browser.element('button.add'); }
	get rolesRoomsSearchForm() { return browser.element('.search [name="room"]'); }

	//permissions grids checkboxes

	get rolesUserCreateC() { return browser.element('[name="perm[user][create-c]"]'); }
	get rolesUserCreateP() { return browser.element('[name="perm[user][create-p]"]'); }
	get rolesUserCreateD() { return browser.element('[name="perm[user][create-d]"]'); }
	get rolesUserMentionAll() { return browser.element('[name="perm[user][mention-all]"]'); }
	get rolesUserPreviewC() { return browser.element('[name="perm[user][preview-c-room]"]'); }
	get rolesUserViewC() { return browser.element('[name="perm[user][view-c-room]"]'); }
	get rolesUserViewD() { return browser.element('[name="perm[user][view-d-room]"]'); }
	get rolesUserViewP() { return browser.element('[name="perm[user][view-p-room]"]'); }
	get rolesUserHistory() { return browser.element('[name="perm[user][view-history]"]'); }
	get rolesOwnerDeleteMessage() { return browser.element('[name="perm[owner][delete-message]"]'); }
	get rolesOwnerEditMessage() { return browser.element('[name="perm[owner][edit-message]"]'); }


	get emojiFilter() { return browser.element('#emoji-filter'); }

	//settings
	get buttonSave() { return browser.element('button.save'); }

	get generalButtonExpandIframe() { return browser.element('.section:nth-of-type(3) .button.expand'); }
	get generalButtonExpandNotifications() { return browser.element('.section:nth-of-type(4) .button.expand'); }
	get generalButtonExpandRest() { return browser.element('.section:nth-of-type(5) .button.expand'); }
	get generalButtonExpandReporting() { return browser.element('.section:nth-of-type(6) .button.expand'); }
	get generalButtonExpandStreamCast() { return browser.element('.section:nth-of-type(7) .button.expand'); }
	get generalButtonExpandTranslations() { return browser.element('.section:nth-of-type(8) .button.expand'); }
	get generalButtonExpandUTF8() { return browser.element('.section:nth-of-type(9) .button.expand'); }

	get generalSiteUrl() { return browser.element('[name="Site_Url"]'); }
	get generalSiteUrlReset() { return browser.element('.reset-setting[data-setting="Site_Url"]'); }
	get generalSiteName() { return browser.element('[name="Site_Name"]'); }
	get generalSiteNameReset() { return browser.element('.reset-setting[data-setting="Site_Name"]'); }
	get generalLanguage() { return browser.element('[name="Language"]'); }
	get generalLanguagePtOption() { return browser.element('[value="pt"]'); }
	get generalLanguageReset() { return browser.element('.reset-setting[data-setting="Language"]'); }
	get generalSelfSignedCertsTrue() { return browser.element('label:nth-of-type(1) [name="Allow_Invalid_SelfSigned_Certs"]'); }
	get generalSelfSignedCertsFalse() { return browser.element('label:nth-of-type(2) [name="Allow_Invalid_SelfSigned_Certs"]'); }
	get generalSelfSignedCertsReset() { return browser.element('.reset-setting[data-setting="Allow_Invalid_SelfSigned_Certs"]'); }
	get generalFavoriteRoomTrue() { return browser.element('label:nth-of-type(1) [name="Favorite_Rooms"]'); }
	get generalFavoriteRoomFalse() { return browser.element('label:nth-of-type(2) [name="Favorite_Rooms"]'); }
	get generalFavoriteRoomReset() { return browser.element('.reset-setting[data-setting="Favorite_Rooms"]'); }
	get generalOpenFirstChannel() { return browser.element('[name="First_Channel_After_Login"]'); }
	get generalOpenFirstChannelReset() { return browser.element('.reset-setting[data-setting="First_Channel_After_Login"]'); }
	get generalCdnPrefix() { return browser.element('[name="CDN_PREFIX"]'); }
	get generalCdnPrefixReset() { return browser.element('.reset-setting[data-setting="CDN_PREFIX"]'); }
	get generalForceSSLTrue() { return browser.element('label:nth-of-type(1) [name="Force_SSL"]'); }
	get generalForceSSLFalse() { return browser.element('label:nth-of-type(2) [name="Force_SSL"]'); }
	get generalForceSSLReset() { return browser.element('.reset-setting[data-setting="Force_SSL"]'); }
	get generalGoogleTagId() { return browser.element('[name="GoogleTagManager_id"]'); }
	get generalGoogleTagIdReset() { return browser.element('.reset-setting[data-setting="GoogleTagManager_id"]'); }
	get generalBugsnagKey() { return browser.element('[name="Bugsnag_api_key"]'); }
	get generalBugsnagKeyReset() { return browser.element('.reset-setting[data-setting="Bugsnag_api_key"]'); }
	get generalIframeSendTrue() { return browser.element('label:nth-of-type(1) [name="Iframe_Integration_send_enable"]'); }
	get generalIframeSendFalse() { return browser.element('label:nth-of-type(2) [name="Iframe_Integration_send_enable"]'); }
	get generalIframeSendReset() { return browser.element('.reset-setting[data-setting="Iframe_Integration_send_enable"]'); }
	get generalIframeSendTargetOrigin() { return browser.element('[name="Iframe_Integration_send_target_origin"]'); }
	get generalIframeSendTargetOriginReset() { return browser.element('.reset-setting[data-setting="Iframe_Integration_send_target_origin"]'); }
	get generalIframeRecieveTrue() { return browser.element('label:nth-of-type(1) [name="Iframe_Integration_receive_enable"]'); }
	get generalIframeRecieveFalse() { return browser.element('label:nth-of-type(2) [name="Iframe_Integration_receive_enable"]'); }
	get generalIframeRecieveFalseReset() { return browser.element('.reset-setting[data-setting="Iframe_Integration_receive_enable"]'); }
	get generalIframeRecieveOrigin() { return browser.element('[name="Iframe_Integration_receive_origin"]'); }
	get generalIframeRecieveOriginReset() { return browser.element('.reset-setting[data-setting="Iframe_Integration_receive_origin"]'); }
	get generalNotificationsMaxRoomMembers() { return browser.element('[name="Notifications_Max_Room_Members"]'); }
	get generalNotificationsMaxRoomMembersReset() { return browser.element('.reset-setting[data-setting="Notifications_Max_Room_Members"]'); }
	get generalRestApiUserLimit() { return browser.element('[name="API_User_Limit"]'); }
	get generalRestApiUserLimitReset() { return browser.element('.reset-setting[data-setting="API_User_Limit"]'); }
	get generalReportingTrue() { return browser.element('label:nth-of-type(1) [name="Statistics_reporting"]'); }
	get generalReportingFalse() { return browser.element('label:nth-of-type(2) [name="Statistics_reporting"]'); }
	get generalReportingReset() { return browser.element('.reset-setting[data-setting="Statistics_reporting"]'); }
	get generalStreamCastAdress() { return browser.element('[name="Stream_Cast_Address"]'); }
	get generalStreamCastAdressReset() { return browser.element('.reset-setting[data-setting="Stream_Cast_Address"]'); }
	get generalUTF8Regex() { return browser.element('[name="UTF8_Names_Validation"]'); }
	get generalUTF8RegexReset() { return browser.element('.reset-setting[data-setting="UTF8_Names_Validation"]'); }
	get generalUTF8NamesSlugTrue() { return browser.element('label:nth-of-type(1) [name="UTF8_Names_Slugify"]'); }
	get generalUTF8NamesSlugFalse() { return browser.element('label:nth-of-type(2) [name="UTF8_Names_Slugify"]'); }
	get generalUTF8NamesSlugReset() { return browser.element('.reset-setting[data-setting="UTF8_Names_Slugify"]'); }

	//accounts
	get accountsButtonExpandDefaultUserPreferences() { return browser.element('.section:nth-of-type(2) .button.expand'); }
	get accountsButtonCollapseDefaultUserPreferences() { return browser.element('.section:nth-of-type(2) .button.collapse'); }

	get accountsEnableAutoAwayTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_enableAutoAway"]'); }
	get accountsEnableAutoAwayFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_enableAutoAway"]'); }
	get accountsEnableAutoAwayReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_enableAutoAway"]'); }

	get accountsIdleTimeoutLimit() { return browser.element('[name="Accounts_Default_User_Preferences_idleTimeoutLimit"]'); }
	get accountsIdleTimeoutLimitReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_idleTimeoutLimit"]'); }

	get accountsNotificationDuration() { return browser.element('[name="Accounts_Default_User_Preferences_desktopNotificationDuration"]'); }
	get accountsNotificationDurationReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_desktopNotificationDuration"]'); }

	get accountsAudioNotifications() { return browser.element('[name="Accounts_Default_User_Preferences_audioNotifications"]'); }
	get accountsAudioNotificationsReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_audioNotifications"]'); }

	get accountsDesktopNotifications() { return browser.element('[name="Accounts_Default_User_Preferences_desktopNotifications"]'); }
	get accountsDesktopNotificationsReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_desktopNotifications"]'); }

	get accountsMobileNotifications() { return browser.element('[name="Accounts_Default_User_Preferences_mobileNotifications"]'); }
	get accountsMobileNotificationsReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_mobileNotifications"]'); }

	get accountsUnreadAlertTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_unreadAlert"]'); }
	get accountsUnreadAlertFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_unreadAlert"]'); }
	get accountsUnreadAlertReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_unreadAlert"]'); }

	get accountsUseEmojisTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_useEmojis"]'); }
	get accountsUseEmojisFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_useEmojis"]'); }
	get accountsUseEmojisReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_useEmojis"]'); }

	get accountsConvertAsciiEmojiTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_convertAsciiEmoji"]'); }
	get accountsConvertAsciiEmojiFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_convertAsciiEmoji"]'); }
	get accountsConvertAsciiEmojiReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_convertAsciiEmoji"]'); }

	get accountsAutoImageLoadTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_autoImageLoad"]'); }
	get accountsAutoImageLoadFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_autoImageLoad"]'); }
	get accountsAutoImageLoadReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_autoImageLoad"]'); }

	get accountsSaveMobileBandwidthTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_saveMobileBandwidth"]'); }
	get accountsSaveMobileBandwidthFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_saveMobileBandwidth"]'); }
	get accountsSaveMobileBandwidthReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_saveMobileBandwidth"]'); }

	get accountsCollapseMediaByDefaultTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_collapseMediaByDefault"]'); }
	get accountsCollapseMediaByDefaultFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_collapseMediaByDefault"]'); }
	get accountsCollapseMediaByDefaultReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_collapseMediaByDefault"]'); }

	get accountsHideUsernamesTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_hideUsernames"]'); }
	get accountsHideUsernamesFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_hideUsernames"]'); }
	get accountsHideUsernamesReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_hideUsernames"]'); }

	get accountsHideRolesTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_hideRoles"]'); }
	get accountsHideRolesFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_hideRoles"]'); }
	get accountsHideRolesReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_hideRoles"]'); }

	get accountsHideFlexTabTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_hideFlexTab"]'); }
	get accountsHideFlexTabFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_hideFlexTab"]'); }
	get accountsHideFlexTabReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_hideFlexTab"]'); }

	get accountsHideAvatarsTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_hideAvatars"]'); }
	get accountsHideAvatarsFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_hideAvatars"]'); }
	get accountsHideAvatarsReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_hideAvatars"]'); }

	get accountsRoomsListExhibitionMode() { return browser.element('[name="Accounts_Default_User_Preferences_roomsListExhibitionMode"]'); }
	get accountsRoomsListExhibitionModeReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_roomsListExhibitionMode"]'); }

	get accountsMergeChannelsTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_mergeChannels"]'); }
	get accountsMergeChannelsFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_mergeChannels"]'); }
	get accountsMergeChannelsReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_mergeChannels"]'); }

	get accountsSendOnEnter() { return browser.element('[name="Accounts_Default_User_Preferences_sendOnEnter"]'); }
	get accountsSendOnEnterReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_sendOnEnter"]'); }

	get accountsViewMode() { return browser.element('[name="Accounts_Default_User_Preferences_viewMode"]'); }
	get accountsViewModeReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_viewMode"]'); }

	get accountsEmailNotificationMode() { return browser.element('[name="Accounts_Default_User_Preferences_emailNotificationMode"]'); }
	get accountsEmailNotificationModeReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_emailNotificationMode"]'); }

	get accountsRoomCounterSidebarTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_roomCounterSidebar"]'); }
	get accountsRoomCounterSidebarFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_roomCounterSidebar"]'); }
	get accountsRoomCounterSidebarReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_roomCounterSidebar"]'); }

	get accountsNewRoomNotification() { return browser.element('[name="Accounts_Default_User_Preferences_newRoomNotification"]'); }
	get accountsNewRoomNotificationReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_newRoomNotification"]'); }

	get accountsNewMessageNotification() { return browser.element('[name="Accounts_Default_User_Preferences_newMessageNotification"]'); }
	get accountsNewMessageNotificationReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_newMessageNotification"]'); }

	get accountsMuteFocusedConversationsTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_Default_User_Preferences_muteFocusedConversations"]'); }
	get accountsMuteFocusedConversationsFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_Default_User_Preferences_muteFocusedConversations"]'); }
	get accountsMuteFocusedConversationsReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_muteFocusedConversations"]'); }

	get accountsNotificationsSoundVolume() { return browser.element('[name="Accounts_Default_User_Preferences_notificationsSoundVolume"]'); }
	get accountsNotificationsSoundVolumeReset() { return browser.element('.reset-setting[data-setting="Accounts_Default_User_Preferences_notificationsSoundVolume"]'); }

	get accountsRealNameChangeTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_AllowRealNameChange"]'); }
	get accountsRealNameChangeFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_AllowRealNameChange"]'); }

	get accountsUsernameChangeTrue() { return browser.element('label:nth-of-type(1) [name="Accounts_AllowUsernameChange"]'); }
	get accountsUsernameChangeFalse() { return browser.element('label:nth-of-type(2) [name="Accounts_AllowUsernameChange"]'); }

	checkUserList(user) {
		const element = browser.element(`td=adminCreated${ user }`);
		element.waitForVisible(5000);
		browser.pause(500);
		const result = element.isVisible();
		if (Array.isArray(result)) {
			return result[0];
		}

		return result;
	}

	getUserFromList(user) {
		const element = browser.element(`td=${ user }`);
		element.waitForVisible(5000);
		return element;
	}

	adminSaveChanges() {
		this.buttonSave.waitForVisible(5000);
		browser.waitUntil(function() {
			return browser.isEnabled('button.save');
		}, 5000);
		this.buttonSave.click();
	}
}

module.exports = new Administration();
