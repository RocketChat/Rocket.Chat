import { addMigration } from '../../lib/migrations';
import { Avatars } from '../../../app/models/server';

addMigration({
	version: 203,
	up() {
		Avatars.tryDropIndex({ name: 1 });
		Avatars.tryEnsureIndex({ name: 1 }, { sparse: true });
	},
});
