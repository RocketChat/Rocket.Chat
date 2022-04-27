import { addMigration } from '../../lib/migrations';
import { Analytics } from '../../../app/models/server/raw';

addMigration({
	version: 182,
	up() {
		Analytics.deleteMany({});
	},
});
