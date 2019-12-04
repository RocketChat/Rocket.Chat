import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from './hasPermission';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { AdminBox } from '../../ui-utils/client/lib/AdminBox';
import { APIClient } from '../../utils/client';
import { Roles } from '../../models/client';
import { rolesStreamer } from './lib/streamer';

Meteor.startup(() => {
	CachedCollectionManager.onLogin(async () => {
		const { roles } = await APIClient.v1.get('roles.list');
		roles.forEach((role) => Roles.insert(role));
	});

	AdminBox.addOption({
		href: 'admin-permissions',
		i18nLabel: 'Permissions',
		icon: 'lock',
		permissionGranted() {
			return hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']);
		},
	});

	rolesStreamer.on('roles', (role) => {
		const events = {
			changed: () => {
				delete role.type;
				Roles.upsert({ _id: role.name }, role);
			},
			removed: () => Roles.remove({ _id: role.name }),
		};
		events[role.type]();
	});
});
