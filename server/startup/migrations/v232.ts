import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 232,
	up() {
		Settings.remove({ _id: { $in: [
			'Log_Package',
			'Log_File',
		] } });
	},
});
