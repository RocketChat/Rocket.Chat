import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

const removed = ['advocacy', 'industry', 'publicRelations', 'healthcarePharmaceutical', 'helpCenter'];

Migrations.add({
	version: 215,
	up() {
		const current = Settings.findOneById('Industry');
		if (removed.includes(current.value)) {
			Settings.update({
				_id: 'Industry',
			}, {
				$set: {
					value: 'other',
				},
			});
		}
	},
});
