import { Migrations } from '../../../app/migrations/server';
import { Avatars } from '../../../app/models/server';

Migrations.add({
	version: 203,
	up() {
		Avatars.tryDropIndex({ name: 1 });
		Avatars.tryEnsureIndex({ name: 1 }, { sparse: true });
	},
});
