import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';

Migrations.add({
	version: 38,
	up() {
		if (settings && settings.get) {
			const allowPinning = settings.get('Message_AllowPinningByAnyone');

			// If public pinning was allowed, add pinning permissions to 'users', else leave it to 'owners' and 'moderators'
			if (allowPinning) {
				if (Permissions) {
					Permissions.update({ _id: 'pin-message' }, { $addToSet: { roles: 'user' } });
				}
			}
		}
	},
});
