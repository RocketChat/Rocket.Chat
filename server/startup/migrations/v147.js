import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

const validSettings = [
	'FEDERATION_Discovery_Method',
	'FEDERATION_Domain',
	'FEDERATION_Enabled',
	'FEDERATION_Hub_URL',
	'FEDERATION_Public_Key',
	'FEDERATION_Status',
	'FEDERATION_Test_Setup',
];

Migrations.add({
	version: 147,
	up() {
		Settings.remove({ $and: [{ _id: /FEDERATION/ }, { _id: { $nin: validSettings } }] });
	},
	down() {
		// Down migration does not apply in this case
	},
});
