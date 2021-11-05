import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 176,
	up() {
		Promise.await(Settings.remove({ _id: 'Livechat', type: 'group' }));
	},
});
