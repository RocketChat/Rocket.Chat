import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';


import { hasAtLeastOnePermission } from './hasPermission';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { APIClient } from '../../utils/client';
import { Roles } from '../../models/client';
import { rolesStreamer } from './lib/streamer';
import { registerAdminSidebarItem } from '../../../client/views/admin';

Meteor.startup(() => {
	CachedCollectionManager.onLogin(async () => {
		const { roles } = await APIClient.v1.get('roles.list');
		// if a role is checked before this collection is populated, it will return undefined
		Roles._collection._docs._map = new Map(roles.map((record) => [record._id, record]));
		Object.values(Roles._collection.queries).forEach((query) => Roles._collection._recomputeResults(query));

		Roles.ready.set(true);
	});

	registerAdminSidebarItem({
		href: 'admin-permissions',
		i18nLabel: 'Permissions',
		icon: 'lock',
		permissionGranted() {
			return hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']);
		},
	});
	const events = {
		changed: (role) => {
			delete role.type;
			Roles.upsert({ _id: role.name }, role);
		},
		removed: (role) => {
			Roles.remove({ _id: role.name });
		},
	};

	Tracker.autorun((c) => {
		if (!Meteor.userId()) {
			return;
		}
		rolesStreamer.on('roles', (role) => events[role.type](role));
		c.stop();
	});
});
