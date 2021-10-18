import { addMigration } from '../../lib/migrations';
import { Analytics } from '../../../app/models/server';

addMigration({
	version: 182,
	up() {
		Analytics.remove({});
	},
});
