import { addMigration } from '../../lib/migrations';
import { Users, Rooms } from '../../../app/models/server';

addMigration({
	version: 254,
	up() {
		Users.tryDropIndex({ bio: 1 });
		Users.tryEnsureIndex({ bio: 1 }, { unique: 1 });

		Rooms.tryDropIndex({ prid: 1 });
		Rooms.tryEnsureIndex({ prid: 1 }, { sparse: true });
	},
});
