import { Meteor } from 'meteor/meteor';
import { Settings } from '../../../models';
import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { hasAtLeastOnePermission } from '../../../authorization/server';

Meteor.methods({
	'public-settings/get'(updatedAt) {
		const records = Settings.findNotHiddenPublic().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
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
		return records;
	},
	'private-settings/get'(updatedAfter) {
		function getAuthorizedSettings(updatedAfter) {
			return Settings.findNotHidden({ updatedAfter }).fetch().filter(function(record) {
				if (hasAtLeastOnePermission(Meteor.userId(), ['view-privileged-setting', 'edit-privileged-setting'])) {
					return !record.hidden;
				} else if (hasPermission(Meteor.userId(), 'manage-selected-settings')) {
					return !record.hidden && hasPermission(Meteor.userId(), `change-setting-${ record._id }`);
				} else {
					return false;
				}
			});
		}

		if (!Meteor.userId()) {
			return [];
		}

		if (!(updatedAfter instanceof Date)) {
			// this does not only imply an unfiltered setting range, it also identifies the caller's context:
			// If called *with* filter (see below), the user wants a colllection as a result.
			// in this case, it shall only be a plain array
			return getAuthorizedSettings(new Date(0));
		}

		return {
			update: getAuthorizedSettings(),
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

			if (setting.public === true) {
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
