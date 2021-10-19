import { addMigration } from '../../lib/migrations';
import { Statistics } from '../../../app/models/server';

addMigration({
	version: 218,
	up() {
		Statistics.tryDropIndex({ createdAt: 1 });
	},
});
