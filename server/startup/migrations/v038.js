import { Migrations } from '/app/migrations';
import { Permissions } from '/app/models';
import { settings } from '/app/settings';

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
