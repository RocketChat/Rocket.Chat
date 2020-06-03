import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models/server';

Migrations.add({
	version: 193,
	up() {
		Users.update(
			{ eppn: { $exists: 1 } },
			{ $rename: { eppn: 'services.saml.eppn' } },
			{ multi: true },
		);
	},
});
