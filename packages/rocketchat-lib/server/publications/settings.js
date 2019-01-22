import { Meteor } from 'meteor/meteor';
import { Settings } from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Notifications } from 'meteor/rocketchat:notifications';

Meteor.methods({
	'public-settings/get'(updatedAt) {
		this.unblock();
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
	'private-settings/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}
		this.unblock();
		if (!hasPermission(Meteor.userId(), 'view-privileged-setting')) {
			return [];
		}
		const records = Settings.findNotHidden().fetch();
		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: Settings.trashFindDeletedAfter(updatedAt, {
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
		return records;
	},
});

Settings.on('change', ({ clientAction, id, data, diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) { // avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const setting = data || Settings.findOneById(id);
			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
			};

			if (setting.public === true) {
				Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
			} else {
				Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, setting);
			}
			break;

		case 'removed':
			Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, { _id: id });
			Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, { _id: id });
			break;
	}
});

Notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return hasPermission(this.userId, 'view-privileged-setting');
});
