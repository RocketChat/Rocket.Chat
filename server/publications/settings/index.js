import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../app/models';
import { hasPermission } from '../../../app/authorization';
import './emitter';

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
		if (!Meteor.userId()) {
			return [];
		}
		if (!hasPermission(Meteor.userId(), 'view-privileged-setting')) {
			return [];
		}

		if (!(updatedAfter instanceof Date)) {
			return Settings.findNotHidden().fetch();
		}

		const records = Settings.findNotHidden({ updatedAfter }).fetch();
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
