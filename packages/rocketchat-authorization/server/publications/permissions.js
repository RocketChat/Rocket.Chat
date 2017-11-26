import {permissionLevel} from '../../lib/rocketchat';

Meteor.methods({
	'permissions/get'(updatedAt) {
		this.unblock();

		const records = RocketChat.models.Permissions.find({level: {$ne: permissionLevel.SETTING}}).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, {
					fields: {
						_id: 1,
						_deletedAt: 1
					}
				}).fetch()
			};
		}

		return records;
	},
	'setting-permissions/get'(updatedAt) {
		this.unblock();

		const records = RocketChat.models.Permissions.find({
			level: permissionLevel.SETTING,
			groupPermissionId: {$exists: true} //filter group permissions themselves, as they are being assigned implicitly
		}, {}, {sort: {group: 1, section: 1, sorter: 1}}).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, {
					fields: {
						_id: 1,
						_deletedAt: 1
					}
				}).fetch()
			};
		}

		return records;
	}
});

function notifySettings(type, permission) {
	if (permission.level === permissionLevel.SETTING) {
		// if the permission changes, the effect on the visible settings depends on the role affected.
		// The selected-settings-based consumers have to react accordingly and either add or remove the
		// setting from the user's collection
		const setting = RocketChat.models.Settings.findOneById(permission.settingId);
		RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', 'auth', setting);
	}
}

RocketChat.models.Permissions.on('changed', (type, permission) => {
	RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', type, permission);
	notifySettings(type, permission);
});

RocketChat.models.Permissions.on('removed', (type, permission) => {
	notifySettings(type, permission);
});
