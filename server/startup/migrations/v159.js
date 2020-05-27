import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 159,
	up() {
		const processingFrequency = Settings.findOne({ _id: 'UserData_ProcessingFrequency' });

		if (processingFrequency && processingFrequency.value === 15) {
			Settings.update({ _id: 'UserData_ProcessingFrequency' }, { value: 2 });
		}

		const messageLimitPerRequest = Settings.findOne({ _id: 'UserData_MessageLimitPerRequest' });
		if (messageLimitPerRequest && messageLimitPerRequest.value === 100) {
			Settings.update({ _id: 'UserData_MessageLimitPerRequest' }, { value: 1000 });
		}
	},
	down() {
		// Down migration does not apply in this case
	},
});
