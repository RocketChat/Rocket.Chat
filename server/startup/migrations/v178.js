import { addMigration } from '../../lib/migrations';
import {
	Settings,
} from '../../../app/models';


addMigration({
	version: 178,
	up() {
		Settings.remove({ _id: 'Livechat_enable_inquiry_fetch_by_stream' });
	},
});
