import { addMigration } from '../../lib/migrations';
import {
	Settings,
} from '../../../app/models';


addMigration({
	version: 176,
	up() {
		Settings.remove({ _id: 'Livechat', type: 'group' });
	},
});
