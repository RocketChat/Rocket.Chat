import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { Settings } from '../../../models';
import { hasAllPermission } from '../../../authorization/server';

Meteor.methods({
	saveSetting(_id, value, editor) {
		if (Meteor.userId() === null) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}

		if (!hasPermission(Meteor.userId(), 'edit-privileged-setting')
			&& !(
				hasAllPermission(Meteor.userId(), ['manage-selected-settings', `change-setting-${ _id }`])
			)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
				settingId: _id,
			});
		}

		// Verify the _id passed in is a string.
		check(_id, String);

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
			default:
				check(value, String);
				break;
		}

		settings.updateById(_id, value, editor);
		return true;
	},
});
