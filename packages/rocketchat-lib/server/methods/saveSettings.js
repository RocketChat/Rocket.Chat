import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { settings } from 'meteor/rocketchat:settings';
import { Settings } from 'meteor/rocketchat:models';

Meteor.methods({
	saveSettings(params = []) {
		if (Meteor.userId() === null) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}

		if (!hasPermission(Meteor.userId(), 'edit-privileged-setting')) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}
		params.forEach(({ _id, value, editor }) => {
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
		});
		return true;
	},
});
