import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 236,
	up() {
		Settings.removeById('Canned Responses');
		Settings.removeById('Canned_Responses');

		Settings.upsert(
			{
				_id: 'Canned_Responses_Enable',
			},
			{
				$set: {
					group: 'Omnichannel',
				},
			},
		);
	},
});
