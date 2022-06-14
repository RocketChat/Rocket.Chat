import { addMigration } from '../../lib/migrations';
import { Rooms } from '../../../app/models/server';

addMigration({
	version: 269,
	up() {
		Rooms.tryDropIndex({ 'tokenpass.tokens.token': 1 });
		Rooms.tryDropIndex({ tokenpass: 1 });
	},
});
