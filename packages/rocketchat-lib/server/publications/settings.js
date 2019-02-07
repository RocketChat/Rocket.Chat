import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'public-settings/get'(updatedAt) {
		const records = RocketChat.models.Settings.findNotHiddenPublic().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
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
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-privileged-setting')) {
			return [];
		}

		if (!(updatedAfter instanceof Date)) {
			return RocketChat.models.Settings.findNotHidden().fetch();
		}

		const records = RocketChat.models.Settings.findNotHidden({ updatedAfter }).fetch();
		return {
			update: records,
			remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAfter, {
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

RocketChat.models.Settings.on('change', ({ clientAction, id, data, diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) { // avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted': {
			const setting = data || RocketChat.models.Settings.findOneById(id);
			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
			};

			if (setting.public === true) {
				RocketChat.Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
			}
			RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, setting);
			break;
		}

		case 'removed': {
			const setting = data || RocketChat.models.Settings.findOneById(id, { fields: { public: 1 } });

			if (setting.public === true) {
				RocketChat.Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, { _id: id });
			}
			RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, { _id: id });
			break;
		}
	}
});

RocketChat.Notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting');
});
