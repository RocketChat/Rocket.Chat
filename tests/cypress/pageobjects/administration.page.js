import Page from './Page';

class Administration extends Page {
	get flexNav() { return browser.element('.flex-nav'); }

	get flexNavContent() { return browser.element('.flex-nav'); }

	get infoLink() { return browser.element('.flex-nav [href="/admin/info"]'); }

	get roomsLink() { return browser.element('.flex-nav [href="/admin/rooms"]'); }

	get usersLink() { return browser.element('.flex-nav [href="/admin/users"]'); }

	get permissionsLink() { return browser.element('.flex-nav [href="/admin/permissions"]'); }

	get customScriptBtn() { return browser.element('.section:nth-of-type(6) .collapse'); }

	get customScriptLoggedOutTextArea() { return browser.element('.section:nth-of-type(6) .CodeMirror-scroll'); }

	get customScriptLoggedInTextArea() { return browser.element('.CodeMirror.cm-s-default:nth-of-type(2)'); }

	get infoRocketChatTableTitle() { return browser.element('[data-qa="admin-info"] [data-qa="rocket-chat-title"]'); }

	get infoRocketChatTable() { return browser.element('[data-qa="admin-info"] [data-qa="rocket-chat-list"]'); }

	get infoCommitTableTitle() { return browser.element('[data-qa="admin-info"] [data-qa="commit-title"]'); }

	get infoCommitTable() { return browser.element('[data-qa="admin-info"] [data-qa="commit-list"]'); }

	get infoRuntimeTableTitle() { return browser.element('[data-qa="admin-info"] [data-qa="runtime-env-title"]'); }

	get infoRuntimeTable() { return browser.element('[data-qa="admin-info"] [data-qa="runtime-env-list"]'); }

	get infoBuildTableTitle() { return browser.element('[data-qa="admin-info"] [data-qa="build-env-title"]'); }

	get infoBuildTable() { return browser.element('[data-qa="admin-info"] [data-qa="build-env-list"]'); }

	get infoUsageTableTitle() { return browser.element('[data-qa="admin-info"] [data-qa="usage-list"]'); }

	get infoUsageTable() { return browser.element('[data-qa="admin-info"] [data-qa="usage-list"]'); }

	get roomsSearchForm() { return browser.element('.content .search'); }

	get roomsFilter() { return browser.element('#rooms-filter'); }

	get roomsChannelsCheckbox() { return browser.element('label:nth-of-type(1) input[name="room-type"]'); }

	get roomsDirectCheckbox() { return browser.element('label:nth-of-type(2) input[name="room-type"]'); }

	get roomsPrivateCheckbox() { return browser.element('label:nth-of-type(3) input[name="room-type"]'); }

	get roomsGeneralChannel() { return browser.element('td=general'); }

	get usersRocketCat() { return browser.element('td=Rocket.Cat'); }

	get usersInternalAdmin() { return browser.element('td .rc-table-wrapper').contains('rocketchat.internal.admin.test'); }

	get usersFilter() { return browser.element('#users-filter'); }

	get rolesNewRolesButton() { return browser.element('.rc-button.new-role'); }

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

	get rolesSettingsFindInput() { return browser.element('input#permissions-filter'); }

	get rolesSettingsTab() { return browser.element('button[data-value="settings"]'); }

	get rolesPermissionsTab() { return browser.element('button[data-value="permissions"]'); }

	// permissions grids checkboxes

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

	get rolesManageSettingsPermissions() { return browser.element('[name="perm[user][manage-selected-settings]"]'); }

	get rolesSettingLayoutTitle() {	return browser.element('[name="perm[user][change-setting-Layout_Home_Title]"');	}

	get emojiFilter() { return browser.element('#emoji-filter'); }

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
		browser.element('.user-info').should('be.visible');
		return browser.element('td').contains(user);
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
