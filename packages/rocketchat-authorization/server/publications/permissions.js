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
		}, {}, {sort:{group: 1, section: 1}}).fetch();

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


RocketChat.models.Permissions.on('changed', (type, permission) => {
	RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', type, permission);
});

