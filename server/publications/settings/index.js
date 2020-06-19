import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../app/models/server';
import { Notifications } from '../../../app/notifications/server';
import { hasPermission, hasAtLeastOnePermission } from '../../../app/authorization/server';
import { getSettingPermissionId } from '../../../app/authorization/lib';

Meteor.methods({
	'public-settings/get'(updatedAt) {
		if (updatedAt instanceof Date) {
			const records = Settings.findNotHiddenPublicUpdatedAfter(updatedAt).fetch();
			return {
				update: records,
				remove: Settings.trashFindDeletedAfter(updatedAt, {
					hidden: {
						$ne: true,
					},
					public: true,
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1,
					},
				}).fetch(),
			};
		}
		return Settings.findNotHiddenPublic().fetch();
	},
	'private-settings/get'(updatedAfter) {
		const uid = Meteor.userId();

		if (!uid) {
			return [];
		}

		const privilegedSetting = hasAtLeastOnePermission(uid, ['view-privileged-setting', 'edit-privileged-setting']);
		const manageSelectedSettings = privilegedSetting || hasPermission(uid, 'manage-selected-settings');

		if (!manageSelectedSettings) {
			return [];
		}

		const bypass = (settings) => settings;

		const applyFilter = (fn, args) => fn(args);

		const getAuthorizedSettingsFiltered = (settings) => settings.filter((record) => hasPermission(uid, getSettingPermissionId(record._id)));

		const getAuthorizedSettings = (updatedAfter, privilegedSetting) => applyFilter(privilegedSetting ? bypass : getAuthorizedSettingsFiltered, Settings.findNotHidden(updatedAfter && { updatedAfter }).fetch());

		if (!(updatedAfter instanceof Date)) {
			// this does not only imply an unfiltered setting range, it also identifies the caller's context:
			// If called *with* filter (see below), the user wants a colllection as a result.
			// in this case, it shall only be a plain array
			return getAuthorizedSettings(updatedAfter, privilegedSetting);
		}

		return {
			update: getAuthorizedSettings(updatedAfter, privilegedSetting),
			remove: Settings.trashFindDeletedAfter(updatedAfter, {
				hidden: {
					$ne: true,
				},
			}, {
				fields: {
					_id: 1,
					_deletedAt: 1,
				},
			}).fetch(),
		};
	},
});

Settings.on('change', ({ clientAction, id, data, diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) { // avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted': {
			const setting = data || Settings.findOneById(id);
			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
			};

			if (setting.public === true) {
				Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
			}
			Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, setting);
			break;
		}

		case 'removed': {
			const setting = data || Settings.findOneById(id, { fields: { public: 1 } });

			if (setting && setting.public === true) {
				Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, { _id: id });
			}
			Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, { _id: id });
			break;
		}
	}
});

Notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return hasAtLeastOnePermission(this.userId, ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']);
});
