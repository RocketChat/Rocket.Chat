import _ from 'underscore';

Meteor.methods({
	'public-settings/get'(updatedAt) {
		this.unblock();
		const records = RocketChat.models.Settings.find().fetch().filter(function(record) {
			return record.hidden !== true && record['public'] === true;
		});
		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
					hidden: {
						$ne: true
					},
					'public': true
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1
					}
				}).fetch()
			};
		}
		return records;
	},
	'private-settings/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}
		this.unblock();
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-privileged-setting')) {
			return [];
		}
		const records = RocketChat.models.Settings.find().fetch().filter(function(record) {
			return record.hidden !== true;
		});
		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
					hidden: {
						$ne: true
					}
				}, {
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

RocketChat.models.Settings.cache.on('changed', function(type, setting) {
	if (setting['public'] === true) {
		RocketChat.Notifications.notifyAllInThisInstance('public-settings-changed', type, _.pick(setting, '_id', 'value', 'editor', 'properties'));
	}
	return RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', type, setting);
});

RocketChat.Notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting');
});
