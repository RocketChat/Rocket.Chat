import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { getSettingPermissionId } from '../../../authorization/lib';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { Settings } from '../../../models/server/raw';

Meteor.methods({
	saveSettings: twoFactorRequired(async function (params = []) {
		const uid = Meteor.userId();
		const settingsNotAllowed = [];
		if (uid === null) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}
		const editPrivilegedSetting = hasPermission(uid, 'edit-privileged-setting');
		const manageSelectedSettings = hasPermission(uid, 'manage-selected-settings');

		await Promise.all(
			params.map(async ({ _id, value }) => {
				// Verify the _id passed in is a string.
				check(_id, String);
				if (!editPrivilegedSetting && !(manageSelectedSettings && hasPermission(uid, getSettingPermissionId(_id)))) {
					return settingsNotAllowed.push(_id);
				}

				const setting = await Settings.findOneById(_id);
				// Verify the value is what it should be
				switch (setting?.type) {
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
			}),
		);

		if (settingsNotAllowed.length) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSettings',
				settingIds: settingsNotAllowed,
			});
		}

		await Promise.all(params.map(({ _id, value, editor }) => Settings.updateValueById(_id, value, editor)));

		return true;
	}, {}),
});
