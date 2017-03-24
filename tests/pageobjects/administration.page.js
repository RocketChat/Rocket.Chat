import Page from './Page';

class Administration extends Page {
	get flexNav() { return browser.element('.flex-nav'); }
	get flexNavContent() { return browser.element('.flex-nav .content'); }
	get layoutLink() { return browser.element('.flex-nav .content [href="/admin/Layout"]'); }
	get infoLink() { return browser.element('.flex-nav .content [href="/admin/info"]'); }
	get roomsLink() { return browser.element('.flex-nav .content [href="/admin/rooms"]'); }
	get usersLink() { return browser.element('.flex-nav .content [href="/admin/users"]'); }
	get generalLink() { return browser.element('.flex-nav .content [href="/admin/General"]'); }
	get permissionsLink() { return browser.element('.flex-nav .content [href="/admin/permissions"]'); }
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
	get generalButtonExpandIframe() { return browser.element('.section:nth-of-type(2) .button.expand'); }
	get generalButtonExpandNotifications() { return browser.element('.section:nth-of-type(3) .button.expand'); }
	get generalButtonExpandRest() { return browser.element('.section:nth-of-type(4) .button.expand'); }
	get generalButtonExpandReporting() { return browser.element('.section:nth-of-type(5) .button.expand'); }
	get generalButtonExpandStreamCast() { return browser.element('.section:nth-of-type(6) .button.expand'); }
	get generalButtonExpandTranslations() { return browser.element('.section:nth-of-type(7) .button.expand'); }
	get generalButtonExpandUTF8() { return browser.element('.section:nth-of-type(8) .button.expand'); }

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
	get generalNotificationDuration() { return browser.element('[name="Desktop_Notifications_Duration"]'); }
	get generalNotificationDurationReset() { return browser.element('.reset-setting[data-setting="Desktop_Notifications_Duration"]'); }
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

	checkUserList(user) {
		const element = browser.element(`td=adminCreated${ user }`);
		element.waitForVisible(5000);
		browser.pause(500);
		const result = element.isVisible();
		return result[0];
	}

	getUserFromList(user) {
		const element = browser.element(`td=${ user }`);
		element.waitForVisible(5000);
		return element;
	}
}

module.exports = new Administration();
