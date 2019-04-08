import { Meteor } from 'meteor/meteor';
import { Settings } from 'meteor/rocketchat:models';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';
import { Notifications } from 'meteor/rocketchat:notifications';

Meteor.methods({
	'public-settings/get'(updatedAfter) {
		const records = Settings.findNotHiddenPublic().fetch();

		if (updatedAfter instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAfter > updatedAfter;
				}),
				remove: Settings.trashFindDeletedAfter(updatedAfter, {
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
		if (!Meteor.userId()) {
			return [];
		}
		const records = Settings.findNotHidden().fetch().filter(function(record) {
			if (authz.hasAtLeastOnePermission(Meteor.userId(), ['view-privileged-setting', 'edit-privileged-setting'])) {
				return record.hidden !== true;
			} else if (authz.hasPermission(Meteor.userId(), 'manage-selected-settings')) {
				return record.hidden !== true && authz.hasPermission(Meteor.userId(), `change-setting-${ record._id }`);
			} else {
				return false;
			}
		});

		if (updatedAfter instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAfter > updatedAfter;
				}),
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
		}

		return {
			update: records,
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
	if (diff && Object.keys(diff).length === 1 && diff._updatedAfter) { // avoid useless changes
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
