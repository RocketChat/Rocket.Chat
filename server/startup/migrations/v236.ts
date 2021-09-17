import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
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
