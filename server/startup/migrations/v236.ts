import { Settings } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 236,
	up() {
		Settings.removeById('Canned Responses');
	},
});
