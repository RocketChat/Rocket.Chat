import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../app/models';
import { hasPermission } from '../../../app/authorization';
import './emitter';

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
