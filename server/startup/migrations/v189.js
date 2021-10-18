import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 189,
	up() {
		Settings.remove({ _id: 'Livechat_Knowledge_Enabled' });
		Settings.remove({ _id: 'Livechat_Knowledge_Apiai_Key' });
		Settings.remove({ _id: 'Livechat_Knowledge_Apiai_Language' });
	},
});
