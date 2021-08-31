import { Settings } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 232,
	up() {
		Settings.removeById('Canned Responses');
	},
});
