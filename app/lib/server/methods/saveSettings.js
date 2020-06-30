import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { Settings } from '../../../models';
import { getSettingPermissionId } from '../../../authorization/lib';

Meteor.methods({
	saveSettings(params = []) {
		const uid = Meteor.userId();
		const settingsNotAllowed = [];
		if (uid === null) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}
		const editPrivilegedSetting = hasPermission(uid, 'edit-privileged-setting');
		const manageSelectedSettings = hasPermission(uid, 'manage-selected-settings');

		params.forEach(({ _id, value }) => {
			// Verify the _id passed in is a string.
			check(_id, String);
			if (!editPrivilegedSetting && !(manageSelectedSettings && hasPermission(uid, getSettingPermissionId(_id)))) {
				return settingsNotAllowed.push(_id);
			}

			const setting = Settings.db.findOneById(_id);
			// Verify the value is what it should be
			switch (setting.type) {
				case 'roomPick':
					check(value, Match.OneOf([Object], ''));
					break;
				case 'boolean':
					check(value, Boolean);
					break;
				case 'int':
					check(value, Number);
					break;
				case 'multiSelect':
					check(value, Array);
					break;
				default:
					check(value, String);
					break;
			}
		});

		if (settingsNotAllowed.length) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSettings',
				settingIds: settingsNotAllowed,
			});
		}

		params.forEach(({ _id, value, editor }) => settings.updateById(_id, value, editor));

		return true;
	},
});
