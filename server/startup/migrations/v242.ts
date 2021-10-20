import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 242,
	up() {
		Settings.upsert(
			{
				_id: 'Livechat_guest_count',
			},
			{
				$set: {
					public: false,
					hidden: true,
				},
			},
		);
		Settings.upsert(
			{
				_id: 'Livechat_Room_Count',
			},
			{
				$set: {
					public: false,
					hidden: true,
				},
			},
		);
	},
});
