import { addMigration } from '../../lib/migrations';
import { Statistics } from '../../../app/models/server/raw';

addMigration({
	version: 218,
	up() {
		// TODO test if dropIndex do not raise exceptions.
		Statistics.col.dropIndex('createdAt_1');
	},
});
