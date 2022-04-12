import { addMigration } from '../../lib/migrations';
import { Users } from '../../../app/models/server';

addMigration({
	version: 260,
	up() {
		Users.tryDropIndex({ 'visitorEmails.address': 1 });
	},
});
