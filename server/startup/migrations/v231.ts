import { Settings } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 231,
	up() {
		Settings.removeById('Canned Responses');
	},
});
